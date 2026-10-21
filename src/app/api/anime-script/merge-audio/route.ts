import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { mergeAudioChunks } from '@/lib/audioMerger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || !Array.isArray(body.chunks) || body.chunks.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No audio chunks provided for merging.',
        },
        { status: 400 }
      );
    }

    const { chunks, pauseMs = 350, projectId, force = false } = body;
    const safeProj = projectId ? projectId.replace(/[^a-zA-Z0-9_-]/g, '') : null;

    // 1. Fast-Path: If master audio already exists on disk and force is not set, return immediately!
    if (safeProj && !force) {
      const dir = path.join(process.cwd(), '.data', 'projects', 'audio', safeProj);
      const masterWavPath = path.join(dir, 'master_voiceover.wav');
      const masterMp3Path = path.join(dir, 'master_voiceover.mp3');

      if (fs.existsSync(masterWavPath)) {
        const stats = fs.statSync(masterWavPath);
        // 24kHz 16-bit mono = 48000 bytes/sec
        const durationSec = parseFloat((stats.size / 48000).toFixed(2));
        const totalSizeMb = parseFloat((stats.size / (1024 * 1024)).toFixed(2));

        return NextResponse.json({
          success: true,
          wavUrl: `/api/anime-script/audio?projectId=${encodeURIComponent(safeProj)}&master=wav`,
          mp3Url: fs.existsSync(masterMp3Path)
            ? `/api/anime-script/audio?projectId=${encodeURIComponent(safeProj)}&master=mp3`
            : undefined,
          durationSec,
          sampleRate: 24000,
          channels: 1,
          totalSizeMb,
        });
      }
    }

    // Resolve audio: strings, objects with audioBase64, or load from .data/projects/audio
    const resolvedChunks: string[] = [];
    for (const chunk of chunks) {
      if (typeof chunk === 'string') {
        resolvedChunks.push(chunk);
      } else if (chunk?.audioBase64) {
        resolvedChunks.push(chunk.audioBase64);
      } else if (safeProj && chunk?.id) {
        const safeChunk = chunk.id.replace(/[^a-zA-Z0-9_-]/g, '');
        const diskPath = path.join(process.cwd(), '.data', 'projects', 'audio', safeProj, `${safeChunk}.wav`);
        if (fs.existsSync(diskPath)) {
          const buf = fs.readFileSync(diskPath);
          resolvedChunks.push(buf.toString('base64'));
        }
      }
    }

    if (resolvedChunks.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not resolve any valid audio take files for merging.',
        },
        { status: 400 }
      );
    }

    const merged = await mergeAudioChunks(resolvedChunks, pauseMs);

    if (!merged.success) {
      return NextResponse.json(
        {
          success: false,
          error: merged.error || 'Failed to merge audio chunks.',
        },
        { status: 500 }
      );
    }

    // Persist master audio directly to disk
    if (safeProj) {
      try {
        const dir = path.join(process.cwd(), '.data', 'projects', 'audio', safeProj);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        if (merged.wavBuffer) {
          fs.writeFileSync(path.join(dir, 'master_voiceover.wav'), merged.wavBuffer);
        } else if (merged.wavBase64) {
          fs.writeFileSync(path.join(dir, 'master_voiceover.wav'), Buffer.from(merged.wavBase64, 'base64'));
        }

        if (merged.mp3Buffer) {
          fs.writeFileSync(path.join(dir, 'master_voiceover.mp3'), merged.mp3Buffer);
        } else if (merged.mp3Base64) {
          fs.writeFileSync(path.join(dir, 'master_voiceover.mp3'), Buffer.from(merged.mp3Base64, 'base64'));
        }
      } catch (e) {
        console.error('Error writing master audio to disk:', e);
      }
    }

    return NextResponse.json({
      success: true,
      wavUrl: safeProj ? `/api/anime-script/audio?projectId=${encodeURIComponent(safeProj)}&master=wav` : undefined,
      mp3Url: safeProj ? `/api/anime-script/audio?projectId=${encodeURIComponent(safeProj)}&master=mp3` : undefined,
      wavBase64: merged.wavBase64,
      mp3Base64: merged.mp3Base64,
      durationSec: merged.durationSec,
      sampleRate: merged.sampleRate,
      channels: merged.channels,
      totalSizeMb: merged.totalSizeMb,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown audio merge failure';
    console.error('Audio merge error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'An internal error occurred while merging audio takes.',
        details: message,
      },
      { status: 500 }
    );
  }
}
