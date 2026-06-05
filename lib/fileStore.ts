export interface StoredFile {
  id: string
  name: string
  ext: string
  type: 'uploaded' | 'generated' | 'game'
  size: number          // chars for text, bytes for binary
  content?: string      // text content if available
  timestamp: number
  convId?: string
}

const KEY = 'vari-files'

export function getFiles(): StoredFile[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function addFile(f: Omit<StoredFile, 'id' | 'timestamp'>): StoredFile {
  const entry: StoredFile = { ...f, id: Date.now().toString() + Math.random().toString(36).slice(2), timestamp: Date.now() }
  const all = [entry, ...getFiles()].slice(0, 60)
  localStorage.setItem(KEY, JSON.stringify(all))
  window.dispatchEvent(new Event('vari-files-update'))
  return entry
}

export function removeFile(id: string) {
  localStorage.setItem(KEY, JSON.stringify(getFiles().filter(f => f.id !== id)))
  window.dispatchEvent(new Event('vari-files-update'))
}

export function clearFiles() {
  localStorage.removeItem(KEY)
  window.dispatchEvent(new Event('vari-files-update'))
}

export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'adesso'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m fa`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h fa`
  return `${Math.floor(h / 24)}g fa`
}

export function extIcon(ext: string): string {
  const map: Record<string, string> = {
    html: '🌐', htm: '🌐',
    css: '🎨', scss: '🎨',
    js: '⚡', ts: '⚡', jsx: '⚡', tsx: '⚡',
    py: '🐍', rb: '💎', go: '🐹', rs: '⚙️',
    json: '📋', yaml: '📋', yml: '📋', toml: '📋',
    md: '📝', txt: '📄',
    pdf: '📕', zip: '📦',
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️', webp: '🖼️',
  }
  return map[ext.toLowerCase()] || '📄'
}
