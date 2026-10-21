import { NextRequest, NextResponse } from 'next/server';
import { translateAnimeScriptChunk } from '@/lib/geminiTranslate';
import { getGoogleApiKeys } from '@/lib/apiKeys';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || !body.sourceText) {
      return NextResponse.json(
        {
          success: false,
          error: 'Source script text is required for translation.',
        },
        { status: 400 }
      );
    }

    const {
      sourceText,
      chunkId,
      model,
      previousHinglishContext,
      upcomingSourceContext,
      terminologyMemory = {},
      episodeTitle,
      chunkNumber,
      totalChunks,
      customGuidance,
    } = body;

    const googleKeys = getGoogleApiKeys();
    if (googleKeys.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'GOOGLE_API_KEY is not configured on the server.',
          details: 'Please add your Google Gemini API key to .env.local.',
        },
        { status: 401 }
      );
    }

    // Dedicated Google Gemini Translation Engine
    const geminiModel =
      model && model.startsWith('gemini') ? model : 'gemini-2.0-flash';

    const result = await translateAnimeScriptChunk({
      model: geminiModel,
      sourceText,
      previousHinglishContext,
      upcomingSourceContext,
      terminologyMemory,
      episodeTitle,
      chunkNumber,
      totalChunks,
      customGuidance,
    });

    if (!result.success) {
      let status = 500;
      if (result.error?.includes('GOOGLE_API_KEY')) {
        status = 401;
      } else if (result.error?.includes('authentication')) {
        status = 403;
      } else if (result.error?.includes('quota') || result.error?.includes('429')) {
        status = 429;
      }

      return NextResponse.json(result, { status });
    }

    return NextResponse.json({
      success: true,
      chunkId,
      translatedText: result.translatedText,
      newTerminology: result.newTerminology || {},
      qualityCheck: result.qualityCheck,
      modelUsed: result.modelUsed,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown translation failure';
    console.error('Translation route error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'An internal error occurred during script translation.',
        details: message,
      },
      { status: 500 }
    );
  }
}
