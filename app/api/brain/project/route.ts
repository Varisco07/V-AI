import { NextRequest, NextResponse } from 'next/server';
import { createProject, listProjects, getProjectStats } from '@/lib/brain/projects';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    const projects = listProjects(status);
    
    // Add stats to each project
    const projectsWithStats = projects.map(project => ({
      ...project,
      stats: getProjectStats(project.id),
    }));

    return NextResponse.json({ projects: projectsWithStats });
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
    
    if (!body.name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const project = createProject({
      name: body.name,
      description: body.description,
      root_path: body.root_path,
      tech_stack: body.tech_stack || [],
      status: body.status || 'active',
      meta: body.meta || {},
    });

    return NextResponse.json({ project });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
