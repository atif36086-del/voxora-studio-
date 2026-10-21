import { NextRequest, NextResponse } from 'next/server';
import {
  listWorkflowProjects,
  getWorkflowProject,
  saveWorkflowProject,
  deleteWorkflowProject,
} from '@/lib/projectStorage';
import { WorkflowProject } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const project = await getWorkflowProject(id);
      if (!project) {
        return NextResponse.json(
          { success: false, error: `Project "${id}" not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, project });
    }

    const projects = await listWorkflowProjects();
    return NextResponse.json({ success: true, projects });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown storage error';
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve projects.', details: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WorkflowProject;

    if (!body || !body.id || !body.name) {
      return NextResponse.json(
        { success: false, error: 'Valid project object with id and name is required.' },
        { status: 400 }
      );
    }

    const saved = await saveWorkflowProject(body);

    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'Failed to write project to disk.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, project: body });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown storage error';
    return NextResponse.json(
      { success: false, error: 'Failed to save project.', details: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required for deletion.' },
        { status: 400 }
      );
    }

    const deleted = await deleteWorkflowProject(id);

    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown storage error';
    return NextResponse.json(
      { success: false, error: 'Failed to delete project.', details: message },
      { status: 500 }
    );
  }
}
