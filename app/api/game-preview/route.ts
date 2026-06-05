import { NextRequest, NextResponse } from 'next/server'

// Re-export the game HTML for preview (same content as create-game but as JSON)
// Import inline to avoid circular deps with the route
const GAMES: Record<string, string> = {
  snake: 'snake',
  '2048': '2048',
  memory: 'memory',
  tetris: 'tetris',
}

export async function POST(req: NextRequest) {
  try {
    const { keyword = 'snake' } = await req.json()
    const key = Object.keys(GAMES).find(k => keyword.includes(k)) || 'snake'

    // Dynamically import the game HTML from create-game route data
    // We just call create-game and extract the HTML from the ZIP
    const origin = req.nextUrl.origin
    const zipRes = await fetch(`${origin}/api/create-game`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: key }),
    })

    if (!zipRes.ok) return NextResponse.json({ html: null })

    // Extract HTML from ZIP using JSZip
    const JSZip = (await import('jszip')).default
    const buffer = Buffer.from(await zipRes.arrayBuffer())
    const zip = await JSZip.loadAsync(buffer)

    let html: string | null = null
    for (const [path, file] of Object.entries(zip.files)) {
      if (path.endsWith('.html') && !file.dir) {
        html = await file.async('string')
        break
      }
    }

    return NextResponse.json({ html })
  } catch (err) {
    console.error('game-preview error:', err)
    return NextResponse.json({ html: null })
  }
}
