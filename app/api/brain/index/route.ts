import { NextRequest, NextResponse } from 'next/server';
import { Indexer } from '@/lib/brain/indexer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body.projectId || !body.rootPath) {
      return NextResponse.json(
        { error: 'projectId and rootPath are required' },
        { status: 400 }
      );
    }

    const indexer = new Indexer({
      projectId: body.projectId,
      rootPath: body.rootPath,
      excludePatterns: body.excludePatterns,
      chunkSize: body.chunkSize,
      chunkOverlap: body.chunkOverlap,
      enableSummaries: body.enableSummaries || false,
    });

    const result = await indexer.indexProject();

    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
