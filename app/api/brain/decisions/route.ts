import { NextRequest, NextResponse } from 'next/server';
import { createDecision, getDecisions } from '@/lib/brain/decisions';

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

    const decisions = getDecisions(projectId);
    return NextResponse.json({ decisions });
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
    
    if (!body.project_id || !body.title || !body.decision) {
      return NextResponse.json(
        { error: 'project_id, title, and decision are required' },
        { status: 400 }
      );
    }

    const decision = createDecision({
      project_id: body.project_id,
      title: body.title,
      context: body.context,
      decision: body.decision,
      alternatives: body.alternatives || [],
      impact: body.impact,
      decided_at: Date.now(),
    });

    return NextResponse.json({ decision });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
