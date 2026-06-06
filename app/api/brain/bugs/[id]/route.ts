import { NextRequest, NextResponse } from 'next/server';
import { getBug, updateBug, deleteBug } from '@/lib/brain/bugs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bug = getBug(params.id);
    
    if (!bug) {
      return NextResponse.json(
        { error: 'Bug not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ bug });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    updateBug(params.id, body);
    const bug = getBug(params.id);
    return NextResponse.json({ bug });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    deleteBug(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
