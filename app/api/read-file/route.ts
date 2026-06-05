import { NextRequest, NextResponse } from 'next/server'

const TEXT_EXTS = new Set([
  'txt','md','py','js','ts','jsx','tsx','html','css','scss','json','xml',
  'yaml','yml','sh','bash','env','toml','ini','cfg','conf','rs','go',
  'java','c','cpp','h','rb','php','sql','csv','log','graphql','vue','svelte',
])

export async function POST(req: NextRequest) {
  try {
    const { data, name, type } = await req.json()

    if (!data) {
      console.error('[read-file] No data provided')
      return NextResponse.json({ error: 'No data' }, { status: 400 })
    }

    const buffer = Buffer.from(data, 'base64')
    const ext = (name?.split('.').pop() || '').toLowerCase()

    console.log(`[read-file] File: ${name}, ext: ${ext}, type: ${type}, buffer: ${buffer.length} bytes`)

    // ── PDF ──────────────────────────────────────────────────────────────────
    if (ext === 'pdf' || type === 'application/pdf') {
      // Use the lib entry point directly to avoid Next.js bundling issues
      // with pdf-parse's test-file auto-load on the main entry point
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse.js')

      const result = await pdfParse(buffer)
      const text = (result.text || '').trim()

      console.log(`[read-file] PDF extracted: ${result.numpages} pages, ${text.length} chars`)

      if (!text) {
        return NextResponse.json({
          text: null,
          error: 'Il PDF non contiene testo estraibile (potrebbe essere scansionato come immagine).',
        })
      }

      return NextResponse.json({ text, pages: result.numpages })
    }

    // ── Plain text / code ────────────────────────────────────────────────────
    if (TEXT_EXTS.has(ext) || (type && type.startsWith('text/'))) {
      const text = buffer.toString('utf-8')
      console.log(`[read-file] Text file read: ${text.length} chars`)
      return NextResponse.json({ text })
    }

    console.log(`[read-file] Unsupported type: ext=${ext}, mime=${type}`)
    return NextResponse.json({ text: null, error: 'Tipo di file non supportato' })

  } catch (err: any) {
    console.error('[read-file] Error:', err?.message || err)
    return NextResponse.json({ error: err?.message || 'Errore nella lettura del file' }, { status: 500 })
  }
}
