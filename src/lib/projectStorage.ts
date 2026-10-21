import fs from 'fs';
import path from 'path';
import { WorkflowProject } from './types';

const PROJECTS_DIR = path.join(process.cwd(), '.data', 'projects');

/**
 * Ensures the project storage directory exists.
 */
function ensureProjectsDir() {
  if (!fs.existsSync(PROJECTS_DIR)) {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  }
}

/**
 * Lists all stored VOXORA voiceover projects with metadata summary.
 */
export async function listWorkflowProjects(): Promise<
  Array<{
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    currentStep: string;
    totalEpisodes: number;
    totalChunks: number;
    completedChunks: number;
    fileName: string;
    hasFinalAudio: boolean;
  }>
> {
  ensureProjectsDir();

  try {
    const files = fs.readdirSync(PROJECTS_DIR);
    const projects = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const fullPath = path.join(PROJECTS_DIR, file);
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8')) as WorkflowProject;

        const totalChunks = data.chunks?.length || 0;
        const completedChunks =
          data.chunks?.filter((c) => c.status === 'completed').length || 0;

        const hasMasterAudio = fs.existsSync(path.join(AUDIO_DIR, data.id, 'master_voiceover.wav'));
        const hasFinalAudio = Boolean(
          data.finalAudio?.wavBase64 || data.finalAudio?.mp3Base64 || data.finalAudio?.wavUrl || hasMasterAudio
        );

        projects.push({
          id: data.id,
          name: data.name,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          currentStep: data.currentStep,
          totalEpisodes: data.metadata?.detectedEpisodes?.length || 1,
          totalChunks,
          completedChunks,
          fileName: data.metadata?.fileName || 'untitled.txt',
          hasFinalAudio,
        });
      } catch (err) {
        console.error(`Error reading project file ${file}:`, err);
      }
    }

    // Sort by most recently updated
    return projects.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (err) {
    console.error('Error listing workflow projects:', err);
    return [];
  }
}

const AUDIO_DIR = path.join(process.cwd(), '.data', 'projects', 'audio');

function ensureAudioSubDir(projectId: string) {
  const dir = path.join(AUDIO_DIR, projectId.replace(/[^a-zA-Z0-9_-]/g, ''));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Retrieves a full workflow project by ID with lightweight audio URL references.
 */
export async function getWorkflowProject(id: string): Promise<WorkflowProject | null> {
  ensureProjectsDir();

  // Sanitize project ID to prevent path traversal
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '');
  const filePath = path.join(PROJECTS_DIR, `${safeId}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const project = JSON.parse(raw) as WorkflowProject;
    const projectAudioDir = path.join(AUDIO_DIR, safeId);

    // Attach lightweight audio streaming URLs and ensure audioStatus is accurate
    if (project.chunks && Array.isArray(project.chunks)) {
      project.chunks.forEach((chunk) => {
        const audioDiskPath = path.join(projectAudioDir, `${chunk.id}.wav`);
        const hasAudioOnDisk = fs.existsSync(audioDiskPath);
        const hasInlineAudio = Boolean(chunk.audioBase64);

        if (hasAudioOnDisk || hasInlineAudio) {
          chunk.audioStatus = 'completed';
          chunk.audioUrl = `/api/anime-script/audio?projectId=${encodeURIComponent(safeId)}&chunkId=${encodeURIComponent(chunk.id)}`;
          // Strip inline base64 from the HTTP response payload to keep it tiny (300KB vs 90MB)
          delete chunk.audioBase64;
        }
      });
    }

    // Attach master voiceover audio URLs if present on disk
    const masterWavPath = path.join(projectAudioDir, 'master_voiceover.wav');
    const masterMp3Path = path.join(projectAudioDir, 'master_voiceover.mp3');
    if (fs.existsSync(masterWavPath)) {
      const stats = fs.statSync(masterWavPath);
      project.finalAudio = {
        ...(project.finalAudio || {}),
        wavUrl: `/api/anime-script/audio?projectId=${encodeURIComponent(safeId)}&master=wav`,
        mp3Url: fs.existsSync(masterMp3Path)
          ? `/api/anime-script/audio?projectId=${encodeURIComponent(safeId)}&master=mp3`
          : project.finalAudio?.mp3Url,
        durationSec: project.finalAudio?.durationSec || parseFloat((stats.size / 48000).toFixed(2)),
        totalSizeMb: project.finalAudio?.totalSizeMb || parseFloat((stats.size / (1024 * 1024)).toFixed(2)),
        mergedAt: project.finalAudio?.mergedAt || stats.mtimeMs,
      };
    }

    return project;
  } catch (err) {
    console.error(`Error loading project ${id}:`, err);
    return null;
  }
}

/**
 * Saves or updates a workflow project, extracting audio takes to disk.
 */
export async function saveWorkflowProject(project: WorkflowProject): Promise<boolean> {
  ensureProjectsDir();

  const safeId = project.id.replace(/[^a-zA-Z0-9_-]/g, '');
  const filePath = path.join(PROJECTS_DIR, `${safeId}.json`);
  const projectAudioDir = ensureAudioSubDir(safeId);

  try {
    // Process chunks: extract any new audioBase64 to separate .wav files on disk
    const sanitizedChunks = project.chunks.map((chunk) => {
      const copy = { ...chunk };
      if (copy.audioBase64) {
        try {
          const audioPath = path.join(projectAudioDir, `${chunk.id}.wav`);
          fs.writeFileSync(audioPath, Buffer.from(copy.audioBase64, 'base64'));
          copy.audioUrl = `/api/anime-script/audio?projectId=${encodeURIComponent(safeId)}&chunkId=${encodeURIComponent(chunk.id)}`;
          copy.audioStatus = 'completed';
          delete copy.audioBase64;
        } catch (e) {
          console.error(`Error saving chunk audio for ${chunk.id}:`, e);
        }
      }
      return copy;
    });

    const toSave: WorkflowProject = {
      ...project,
      chunks: sanitizedChunks,
      updatedAt: Date.now(),
    };

    fs.writeFileSync(filePath, JSON.stringify(toSave, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error saving project ${project.id}:`, err);
    return false;
  }
}

/**
 * Deletes a workflow project.
 */
export async function deleteWorkflowProject(id: string): Promise<boolean> {
  ensureProjectsDir();

  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '');
  const filePath = path.join(PROJECTS_DIR, `${safeId}.json`);

  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (err) {
    console.error(`Error deleting project ${id}:`, err);
    return false;
  }
}
