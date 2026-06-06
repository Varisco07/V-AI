import { NextRequest, NextResponse } from 'next/server';
import { createTask, getTasks, getAITasks } from '@/lib/brain/tasks';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const onlyAI = searchParams.get('onlyAI') === 'true';

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    let tasks;
    if (onlyAI) {
      tasks = getAITasks(projectId);
    } else {
      const filters: any = {};
      if (searchParams.get('status')) filters.status = searchParams.get('status');
      if (searchParams.get('type')) filters.type = searchParams.get('type');
      if (searchParams.get('assigned_to')) filters.assigned_to = searchParams.get('assigned_to');
      
      tasks = getTasks(projectId, filters);
    }

    return NextResponse.json({ tasks });
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

    const task = createTask({
      project_id: body.project_id,
      title: body.title,
      description: body.description,
      type: body.type || 'feature',
      status: body.status || 'open',
      priority: body.priority || 3,
      assigned_to: body.assigned_to || 'ai',
      parent_task: body.parent_task,
      related_files: body.related_files || [],
      ai_notes: body.ai_notes,
    });

    return NextResponse.json({ task });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
