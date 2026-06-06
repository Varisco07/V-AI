import { NextRequest, NextResponse } from 'next/server'
import { saveMemory, saveFact, searchMemories, getAllFacts, getMemoryStats, deleteMemory, clearMemories, buildMemoryContext, MemoryType } from '@/lib/memory'

export async function POST(req: NextRequest) {
  try {
    const { action, ...p } = await req.json()
    switch (action) {
      case 'save': return NextResponse.json({ id: saveMemory({ type: p.type as MemoryType, content: p.content, summary: p.summary, tags: p.tags, importance: p.importance }) })
      case 'save_fact': saveFact(p.key, p.value); return NextResponse.json({ ok: true })
      case 'search': return NextResponse.json({ results: searchMemories(p.query, p.limit ?? 5) })
      case 'facts': return NextResponse.json({ facts: getAllFacts() })
      case 'stats': return NextResponse.json(getMemoryStats())
      case 'context': return NextResponse.json({ context: buildMemoryContext(p.query ?? '') })
      case 'delete': deleteMemory(p.id); return NextResponse.json({ ok: true })
      case 'clear': clearMemories(p.type); return NextResponse.json({ ok: true })
      default: return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
