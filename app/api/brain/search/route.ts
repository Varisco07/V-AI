import { NextRequest, NextResponse } from 'next/server';
import { BM25Search } from '@/lib/brain/search';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body.query || !body.projectId) {
      return NextResponse.json(
        { error: 'query and projectId are required' },
        { status: 400 }
      );
    }

    const search = new BM25Search();
    const results = search.search(
      body.query,
      body.projectId,
      body.topK || 5,
      body.minScore || 0.1
    );

    // Also build formatted context
    const context = search.buildBrainContext(
      body.query,
      body.projectId,
      body.maxTokens || 2000
    );

    return NextResponse.json({ results, context });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
