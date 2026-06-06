import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

interface ProjectFile { path: string; content: string; name?: string }
interface FilePlan { path: string; description: string; priority: number }
interface Plan { projectName: string; description: string; techStack: string[]; files: FilePlan[] }

async function ollama(prompt: string, model: string, maxTokens = 4096): Promise<string> {
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false, options: { temperature: 0.2, top_p: 0.9, num_predict: maxTokens } }),
  })
  if (!res.ok) throw new Error('Ollama non risponde')
  return (await res.json()).response?.trim() ?? ''
}

async function planArch(request: string, model: string): Promise<Plan> {
  const raw = await ollama(
    `You are a software architect. Plan the project structure for: "${request}"
Respond with ONLY valid JSON (no markdown):
{"projectName":"kebab-case","description":"one line","techStack":["tech1"],"files":[{"path":"index.html","description":"main page","priority":1}]}
Max 10 files. Always include README.md. Priority 1=first.`,
    model, 1024
  )
  try {
    const m = raw.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
  } catch {}
  return { projectName: 'generated-project', description: request.slice(0, 60), techStack: ['HTML','CSS','JS'],
    files: [{ path:'index.html', description:'Main page', priority:1 }, { path:'style.css', description:'Styles', priority:2 }, { path:'app.js', description:'Logic', priority:3 }, { path:'README.md', description:'Docs', priority:4 }] }
}

async function generateFile(filePath: string, desc: string, projectCtx: string, done: ProjectFile[], model: string): Promise<string> {
  const content = await ollama(
    `Generate the COMPLETE content for this file.
Project: ${projectCtx}
File: ${filePath} — ${desc}
${done.length ? `Already done: ${done.map(f=>f.path).join(', ')}` : ''}
Rules: COMPLETE code only, no "...", no placeholders, no markdown fences in output.
Output ONLY the file content:`,
    model, 4096
  )
  return content.replace(/^```[\w]*\n?/m, '').replace(/\n?```$/m, '').trim()
}

function validate(filePath: string, content: string): string[] {
  const issues: string[] = []
  if (content.length < 10) { issues.push('File vuoto'); return issues }
  const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
  if (['js','ts','jsx','tsx'].includes(ext)) {
    if (Math.abs((content.match(/\{/g)?.length??0) - (content.match(/\}/g)?.length??0)) > 3) issues.push('Parentesi sbilanciate')
    if (content.includes('// ...') || content.includes('/* ... */')) issues.push('File troncato')
  }
  if (ext === 'html' && !content.includes('</html>')) issues.push('HTML non chiuso')
  if (ext === 'json') { try { JSON.parse(content) } catch { issues.push('JSON non valido') } }
  return issues
}

async function autoFix(filePath: string, content: string, issues: string[], model: string): Promise<string> {
  const fixed = await ollama(
    `Fix this file. Issues: ${issues.join(', ')}\nFile: ${filePath}\n${content.slice(0,2000)}\nReturn ONLY the complete fixed content:`,
    model, 4096
  )
  return fixed.replace(/^```[\w]*\n?/m, '').replace(/\n?```$/m, '').trim()
}

export async function POST(req: NextRequest) {
  try {
    const { request, model = 'llama3.1:8b' } = await req.json()
    if (!request) return NextResponse.json({ error: 'Request required' }, { status: 400 })

    const plan = await planArch(request, model)
    const ctx = `${plan.projectName}: ${plan.description}. Stack: ${plan.techStack.join(', ')}`
    const sortedFiles = [...plan.files].sort((a,b) => a.priority - b.priority)
    const generated: ProjectFile[] = []

    for (const spec of sortedFiles) {
      let content = await generateFile(spec.path, spec.description, ctx, generated, model)
      const issues = validate(spec.path, content)
      if (issues.length) content = await autoFix(spec.path, content, issues, model)
      generated.push({ path: spec.path, content, name: plan.projectName })
    }

    const zip = new JSZip()
    const folder = zip.folder(plan.projectName)!
    for (const f of generated) {
      const parts = f.path.split('/').filter(Boolean)
      if (parts.length > 1) {
        let cur = folder
        for (let i = 0; i < parts.length-1; i++) cur = cur.folder(parts[i])!
        cur.file(parts[parts.length-1], f.content)
      } else { folder.file(f.path, f.content) }
    }

    const buffer = await zip.generateAsync({ type:'nodebuffer', compression:'DEFLATE', compressionOptions:{level:6} })
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${plan.projectName}.zip"`,
        'Content-Length': String(buffer.length),
        'X-Project-Name': plan.projectName,
        'X-File-Count': String(generated.length),
        'X-Files-Json': JSON.stringify(generated),
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
