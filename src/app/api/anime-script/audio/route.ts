import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AUDIO_DIR = path.join(process.cwd(), '.data', 'projects', 'audio');
const PROJECTS_DIR = path.join(process.cwd(), '.data', 'projects');

function ensureAudioDir(projectId: string) {
  const dir = path.join(AUDIO_DIR, projectId.replace(/[^a-zA-Z0-9_-]/g, ''));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function sendAudioResponse(
  request: NextRequest,
  buffer: Buffer,
  contentType = 'audio/wav',
  downloadFilename?: string
): NextResponse {
  const totalSize = buffer.length;
  const rangeHeader = request.headers.get('range');
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable',
  };

  if (downloadFilename) {
    headers['Content-Disposition'] = `attachment; filename="${downloadFilename}"`;
  }

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;

      if (start < totalSize && end >= start) {
        const actualEnd = Math.min(end, totalSize - 1);
        const chunkSize = actualEnd - start + 1;
        const sliced = buffer.subarray(start, actualEnd + 1);

        headers['Content-Range'] = `bytes ${start}-${actualEnd}/${totalSize}`;
        headers['Content-Length'] = chunkSize.toString();

        return new NextResponse(new Uint8Array(sliced), {
          status: 206,
          headers,
        });
      }
    }
  }

  headers['Content-Length'] = totalSize.toString();

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers,
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId')?.replace(/[^a-zA-Z0-9_-]/g, '');
    const chunkId = searchParams.get('chunkId')?.replace(/[^a-zA-Z0-9_-]/g, '');
    const master = searchParams.get('master'); // 'wav' | 'mp3'
    const download = searchParams.get('download') === '1';

    if (!projectId) {
      return new NextResponse('Missing projectId', { status: 400 });
    }

    // Serve Master Audio if requested
    if (master) {
      const ext = master === 'mp3' ? 'mp3' : 'wav';
      const masterPath = path.join(AUDIO_DIR, projectId, `master_voiceover.${ext}`);
      if (!fs.existsSync(masterPath)) {
        return new NextResponse(`Master ${ext.toUpperCase()} audio not found. Please merge chunks first.`, { status: 404 });
      }
      const buffer = fs.readFileSync(masterPath);
      return sendAudioResponse(
        request,
        buffer,
        ext === 'mp3' ? 'audio/mp3' : 'audio/wav',
        download ? `Master_Voiceover_${projectId}.${ext}` : undefined
      );
    }

    if (!chunkId) {
      return new NextResponse('Missing chunkId', { status: 400 });
    }

    const audioFilePath = path.join(AUDIO_DIR, projectId, `${chunkId}.wav`);

    // 1. Direct file stream if already on disk
    if (fs.existsSync(audioFilePath)) {
      const buffer = fs.readFileSync(audioFilePath);
      return sendAudioResponse(request, buffer, 'audio/wav');
    }

    // 2. Check project JSON to lazily extract if needed
    const projPath = path.join(PROJECTS_DIR, `${projectId}.json`);
    if (fs.existsSync(projPath)) {
      try {
        const raw = fs.readFileSync(projPath, 'utf8');
        const proj = JSON.parse(raw);
        const chunk = proj.chunks?.find((c: { id: string }) => c.id === chunkId);
        if (chunk?.audioBase64) {
          const dir = ensureAudioDir(projectId);
          const buf = Buffer.from(chunk.audioBase64, 'base64');
          fs.writeFileSync(path.join(dir, `${chunkId}.wav`), buf);

          return sendAudioResponse(request, buf);
        }
      } catch (e) {
        console.error('Error reading project JSON for audio lazy extraction:', e);
      }
    }

    return new NextResponse('Audio take not found', { status: 404 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new NextResponse(`Error serving audio: ${msg}`, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, chunkId, audioBase64 } = body;

    if (!projectId || !chunkId || !audioBase64) {
      return NextResponse.json(
        { success: false, error: 'projectId, chunkId, and audioBase64 are required' },
        { status: 400 }
      );
    }

    const dir = ensureAudioDir(projectId);
    const audioPath = path.join(dir, `${chunkId.replace(/[^a-zA-Z0-9_-]/g, '')}.wav`);
    const buffer = Buffer.from(audioBase64, 'base64');
    fs.writeFileSync(audioPath, buffer);

    const audioUrl = `/api/anime-script/audio?projectId=${encodeURIComponent(projectId)}&chunkId=${encodeURIComponent(chunkId)}`;

    return NextResponse.json({
      success: true,
      audioUrl,
      sizeBytes: buffer.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown storage error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
