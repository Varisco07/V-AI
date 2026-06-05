import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

const TEXT_EXTENSIONS = new Set([
  'txt','md','py','js','ts','jsx','tsx','html','css','scss','json','xml','yaml','yml',
  'sh','bash','zsh','env','toml','ini','cfg','conf','gitignore','dockerfile','makefile',
  'rs','go','java','c','cpp','h','hpp','rb','php','swift','kt','dart','sql','graphql',
  'vue','svelte','astro','prisma','proto','lock','csv','log','editorconfig',
])

function isTextFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const base = filename.toLowerCase()
  return TEXT_EXTENSIONS.has(ext) || base === 'makefile' || base === 'dockerfile' || !ext
}

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json() // base64 encoded zip
    if (!data) return NextResponse.json({ error: 'No data provided' }, { status: 400 })

    const buffer = Buffer.from(data, 'base64')
    const zip = await JSZip.loadAsync(buffer)

    const files: Array<{ path: string; content: string; size: number; isBinary: boolean }> = []

    const tasks = Object.entries(zip.files)
      .filter(([, file]) => !file.dir)
      .map(async ([path, file]) => {
        const isBinary = !isTextFile(path)
        if (isBinary) {
          files.push({ path, content: '[binary file]', size: 0, isBinary: true })
          return
        }
        try {
          const content = await file.async('string')
          files.push({ path, content, size: content.length, isBinary: false })
        } catch {
          files.push({ path, content: '[unreadable]', size: 0, isBinary: true })
        }
      })

    await Promise.all(tasks)
    files.sort((a, b) => a.path.localeCompare(b.path))

    return NextResponse.json({ files })
  } catch (error) {
    console.error('Read ZIP error:', error)
    return NextResponse.json({ error: 'Failed to read ZIP' }, { status: 500 })
  }
}
