import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_DIR = path.resolve(process.cwd(), '.vari-memory')
const DB_PATH = path.join(DB_DIR, 'memory.db')

function getDb(): Database.Database {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      type       TEXT NOT NULL,
      content    TEXT NOT NULL,
      summary    TEXT,
      tags       TEXT DEFAULT '[]',
      importance INTEGER DEFAULT 5,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS facts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      key        TEXT UNIQUE NOT NULL,
      value      TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_mem_type ON memories(type);
    CREATE INDEX IF NOT EXISTS idx_mem_imp  ON memories(importance DESC);
  `)
  return db
}

export type MemoryType = 'conversation' | 'fact' | 'code' | 'preference'

export interface Memory {
  id: number; type: MemoryType; content: string; summary: string
  tags: string[]; importance: number; created_at: number; updated_at: number
}

export function saveMemory(data: { type: MemoryType; content: string; summary?: string; tags?: string[]; importance?: number }): number {
  const db = getDb()
  const now = Date.now()
  const r = db.prepare(`
    INSERT INTO memories (type, content, summary, tags, importance, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(data.type, data.content, data.summary ?? data.content.slice(0, 120),
    JSON.stringify(data.tags ?? []), data.importance ?? 5, now, now)
  db.close()
  return r.lastInsertRowid as number
}

export function saveFact(key: string, value: string) {
  const db = getDb()
  db.prepare(`INSERT INTO facts (key,value,updated_at) VALUES (?,?,?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`)
    .run(key, value, Date.now())
  db.close()
}

export function searchMemories(query: string, limit = 5): Memory[] {
  const db = getDb()
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2).slice(0, 5)
  let rows: any[]
  if (!words.length) {
    rows = db.prepare(`SELECT * FROM memories ORDER BY importance DESC, updated_at DESC LIMIT ?`).all(limit)
  } else {
    const cond = words.map(() => `(LOWER(content) LIKE ? OR LOWER(summary) LIKE ?)`).join(' OR ')
    const params = words.flatMap(w => [`%${w}%`, `%${w}%`])
    rows = db.prepare(`SELECT * FROM memories WHERE ${cond} ORDER BY importance DESC, updated_at DESC LIMIT ?`)
      .all(...params, limit)
  }
  db.close()
  return rows.map(r => ({ ...r, tags: JSON.parse(r.tags ?? '[]') }))
}

export function getAllFacts(): Record<string, string> {
  const db = getDb()
  const rows = db.prepare(`SELECT key, value FROM facts`).all() as any[]
  db.close()
  return Object.fromEntries(rows.map(r => [r.key, r.value]))
}

export function getMemoryStats() {
  const db = getDb()
  const total = (db.prepare(`SELECT COUNT(*) as n FROM memories`).get() as any).n
  const byType = (db.prepare(`SELECT type, COUNT(*) as n FROM memories GROUP BY type`).all() as any[])
  db.close()
  return { total, byType: Object.fromEntries(byType.map(r => [r.type, r.n])) }
}

export function deleteMemory(id: number) {
  const db = getDb(); db.prepare(`DELETE FROM memories WHERE id = ?`).run(id); db.close()
}

export function clearMemories(type?: MemoryType) {
  const db = getDb()
  if (type) db.prepare(`DELETE FROM memories WHERE type = ?`).run(type)
  else db.prepare(`DELETE FROM memories`).run()
  db.close()
}

export function buildMemoryContext(query: string): string {
  try {
    const facts = getAllFacts()
    const relevant = searchMemories(query, 4)
    const parts: string[] = []
    if (Object.keys(facts).length) parts.push(`Facts: ${Object.entries(facts).map(([k,v]) => `${k}=${v}`).join(', ')}`)
    if (relevant.length) parts.push(`Memory: ${relevant.map(m => m.summary).join(' | ')}`)
    return parts.join('\n')
  } catch { return '' }
}
