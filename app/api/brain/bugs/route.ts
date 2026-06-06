import { NextRequest, NextResponse } from 'next/server';
import { createBug, getBugs } from '@/lib/brain/bugs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const filters: any = {};
    if (searchParams.get('severity')) filters.severity = searchParams.get('severity');
    if (searchParams.get('status')) filters.status = searchParams.get('status');

    const bugs = getBugs(projectId, filters);
    return NextResponse.json({ bugs });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body.project_id || !body.title) {
      return NextResponse.json(
        { error: 'project_id and title are required' },
        { status: 400 }
      );
    }

    const bug = createBug({
      project_id: body.project_id,
      title: body.title,
      description: body.description,
      severity: body.severity || 'medium',
      status: body.status || 'open',
      file_path: body.file_path,
      line_number: body.line_number,
      error_trace: body.error_trace,
      root_cause: body.root_cause,
      fix_applied: body.fix_applied,
    });

    return NextResponse.json({ bug });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
