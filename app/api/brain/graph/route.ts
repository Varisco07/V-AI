import { NextRequest, NextResponse } from 'next/server';
import { 
  getNodesByType, 
  findComponentUsage, 
  findFunctionCallers,
  findShortestPath,
  exportSubgraph 
} from '@/lib/brain/knowledge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    if (type) {
      const nodes = getNodesByType(projectId, type);
      return NextResponse.json({ nodes });
    }

    return NextResponse.json({ nodes: [] });
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
    
    if (body.action === 'findComponentUsage') {
      const nodes = findComponentUsage(body.componentName, body.projectId);
      return NextResponse.json({ nodes });
    }

    if (body.action === 'findFunctionCallers') {
      const nodes = findFunctionCallers(body.functionName, body.projectId);
      return NextResponse.json({ nodes });
    }

    if (body.action === 'findPath') {
      const path = findShortestPath(body.fromNodeId, body.toNodeId, body.maxDepth || 5);
      return NextResponse.json({ path });
    }

    if (body.action === 'exportSubgraph') {
      const graph = exportSubgraph(body.nodeId, body.depth || 2);
      return NextResponse.json({ graph });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
