// RAG — Retrieval Augmented Generation (no external dependencies)

export interface RagChunk { id: string; source: string; content: string; index: number; tokens: number }
export interface RagResult { chunk: RagChunk; score: number }
export interface FileInput { name: string; content: string }

const CHUNK_SIZE = 400
const CHUNK_OVERLAP = 80

// ── Chunking ──────────────────────────────────────────────────────────────────

export function chunkText(text: string, source: string): RagChunk[] {
  const clean = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  if (!clean) return []
  const paras = clean.split(/\n\n+/)
  const chunks: RagChunk[] = []
  let buf = '', idx = 0
  for (const p of paras) {
    if (buf.length + p.length > CHUNK_SIZE && buf.length > 0) {
      chunks.push({ id: `${source}::${idx}`, source, content: buf.trim(), index: idx++, tokens: Math.ceil(buf.length/4) })
      buf = buf.slice(-CHUNK_OVERLAP) + '\n' + p
    } else { buf = buf ? buf + '\n' + p : p }
  }
  if (buf.trim().length > 20) chunks.push({ id: `${source}::${idx}`, source, content: buf.trim(), index: idx, tokens: Math.ceil(buf.length/4) })
  return chunks
}

// ── TF-IDF similarity ─────────────────────────────────────────────────────────

function tokenize(text: string): Map<string, number> {
  const freq = new Map<string, number>()
  for (const w of text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2))
    freq.set(w, (freq.get(w) ?? 0) + 1)
  return freq
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, na = 0, nb = 0
  for (const [t, fa] of a) { na += fa*fa; dot += fa*(b.get(t)??0) }
  for (const [, fb] of b) nb += fb*fb
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0
}

export function searchChunks(query: string, chunks: RagChunk[], topK = 4): RagResult[] {
  if (!chunks.length) return []
  const qt = tokenize(query)
  return chunks
    .map(c => ({ chunk: c, score: cosine(qt, tokenize(c.content)) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

// ── Full pipeline ─────────────────────────────────────────────────────────────

export function buildRagContext(query: string, files: FileInput[], maxTokens = 2000): string {
  if (!files.length) return ''
  const allChunks: RagChunk[] = []
  for (const f of files) {
    if (!f.content || f.content === '[binary file]') continue
    allChunks.push(...chunkText(f.content, f.name))
  }
  if (!allChunks.length) return ''
  const results = searchChunks(query, allChunks, 6)
  const target = results.length ? results : allChunks.slice(0, 3).map(c => ({ chunk: c, score: 0 }))

  const lines = ['=== RELEVANT CONTEXT ===']
  let used = 0
  for (const { chunk } of target) {
    if (used + chunk.tokens > maxTokens) break
    lines.push(`\n--- ${chunk.source} ---\n${chunk.content}`)
    used += chunk.tokens
  }
  lines.push('\n=== END CONTEXT ===\n')
  return lines.join('\n')
}

export interface ProjectStructure { totalFiles: number; totalChars: number; languages: Record<string,number>; summary: string }

export function analyzeProject(files: FileInput[]): ProjectStructure {
  const languages: Record<string, number> = {}
  let totalChars = 0
  for (const f of files) {
    if (!f.content || f.content === '[binary file]') continue
    const ext = f.name.split('.').pop()?.toLowerCase() ?? 'other'
    languages[ext] = (languages[ext] ?? 0) + 1
    totalChars += f.content.length
  }
  const top = Object.entries(languages).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([l,n])=>`${l}(${n})`).join(', ')
  return { totalFiles: files.length, totalChars, languages, summary: `${files.length} files, ~${Math.round(totalChars/1000)}k chars. Languages: ${top}.` }
}
