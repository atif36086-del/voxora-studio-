import { NextRequest, NextResponse } from 'next/server';
import {
  extractTextFromFileBuffer,
  normalizeExtractedText,
  detectEpisodes,
  calculateScriptMetadata,
  chunkEpisodeText,
} from '@/lib/documentExtractor';
import { WorkflowChunk } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let fileName = 'pasted_script.txt';
    let fileSize = 0;
    let rawText = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const directText = formData.get('text') as string | null;

      if (file && typeof file === 'object' && 'arrayBuffer' in file) {
        fileName = file.name || 'uploaded_script.txt';
        fileSize = file.size || 0;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        rawText = await extractTextFromFileBuffer(buffer, fileName);
      } else if (directText) {
        rawText = directText;
        fileSize = Buffer.byteLength(directText, 'utf-8');
      }
    } else {
      // JSON body
      const json = await request.json().catch(() => ({}));
      rawText = json.text || '';
      fileName = json.fileName || 'script.txt';
      fileSize = Buffer.byteLength(rawText, 'utf-8');
    }

    const normalizedText = normalizeExtractedText(rawText);

    if (!normalizedText) {
      return NextResponse.json(
        {
          success: false,
          error: 'No readable text could be extracted from the file.',
          details: 'Please ensure your PDF, TXT, or DOCX document contains selectable text.',
        },
        { status: 400 }
      );
    }

    // Automatically detect episodes / sections
    const episodes = detectEpisodes(normalizedText);

    // Calculate metadata, token approximations, and cost projections
    const metadata = calculateScriptMetadata(fileName, fileSize, episodes);

    // Generate smart chunks across all detected episodes
    const allChunks: WorkflowChunk[] = [];
    for (const ep of episodes) {
      const epChunks = chunkEpisodeText(
        ep.episodeNumber,
        ep.title,
        ep.text,
        1400,
        1800
      );
      allChunks.push(...epChunks);
    }

    return NextResponse.json({
      success: true,
      rawText: normalizedText,
      metadata,
      episodes,
      chunks: allChunks,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown extraction failure';
    console.error('Script extraction error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process document extraction.',
        details: message,
      },
      { status: 500 }
    );
  }
}
