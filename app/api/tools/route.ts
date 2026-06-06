import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

const ALLOWED_CMDS = ['ls', 'dir', 'cat', 'pwd', 'echo', 'node -e', 'npm list', 'git log', 'git status', 'git diff']

function isSafe(cmd: string): boolean {
  const c = cmd.trim().toLowerCase()
  return ALLOWED_CMDS.some(a => c.startsWith(a))
}

async function executeTool(name: string, params: Record<string, string>, origin: string): Promise<string> {
  switch (name) {

    case 'search_web': {
      const res = await fetch(`${origin}/api/web-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: params.query, language: 'it' }),
      })
      const data = await res.json()
      if (!data.results?.length) return 'Nessun risultato trovato.'
      return (data.results as any[])
        .map((r: any) => `**${r.title}** (${r.source})\n${r.snippet}`)
        .join('\n\n---\n\n')
    }

    case 'read_file': {
      try {
        const safe = path.resolve(process.cwd(), params.filepath.replace(/^\//, ''))
        const content = await fs.readFile(safe, 'utf-8')
        return content.slice(0, 6000)
      } catch {
        return `File non trovato: ${params.filepath}`
      }
    }

    case 'write_file': {
      try {
        const safe = path.resolve(process.cwd(), params.filepath.replace(/^\//, ''))
        await fs.mkdir(path.dirname(safe), { recursive: true })
        await fs.writeFile(safe, params.content, 'utf-8')
        return `✅ File scritto: ${params.filepath}`
      } catch (e: any) {
        return `Errore: ${e.message}`
      }
    }

    case 'list_files': {
      try {
        const safe = path.resolve(process.cwd(), (params.dirpath || '.').replace(/^\//, ''))
        const entries = await fs.readdir(safe, { withFileTypes: true })
        return entries.map(e => `${e.isDirectory() ? '📁' : '📄'} ${e.name}`).join('\n')
      } catch {
        return `Directory non trovata: ${params.dirpath}`
      }
    }

    case 'run_terminal': {
      if (!isSafe(params.command)) return `Comando non permesso: "${params.command}"`
      try {
        const { stdout, stderr } = await execAsync(params.command, { timeout: 8000 })
        return (stdout || stderr || '(nessun output)').slice(0, 2000)
      } catch (e: any) {
        return `Errore: ${e.message}`
      }
    }

    default:
      return `Tool sconosciuto: ${name}`
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tool, params } = await req.json()
    if (!tool) return NextResponse.json({ error: 'Tool name required' }, { status: 400 })
    const origin = req.nextUrl?.origin || 'http://localhost:3000'
    const result = await executeTool(tool, params || {}, origin)
    return NextResponse.json({ result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
