// Shared conversation store (localStorage-backed)

export interface StoredMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  files?: Array<{ path: string; content: string }>
  zipInfo?: { name: string; fileCount: number }
}

export interface Conversation {
  id: string
  title: string
  messages: StoredMessage[]
  createdAt: number
  updatedAt: number
}

const KEY = 'vari-ai-conversations'
const ACTIVE_KEY = 'vari-ai-active-conv'

export function loadConversations(): Conversation[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function saveConversations(convs: Conversation[]) {
  localStorage.setItem(KEY, JSON.stringify(convs))
  window.dispatchEvent(new Event('vari-conv-update'))
}

export function getActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY)
}

export function setActiveId(id: string | null) {
  if (id) localStorage.setItem(ACTIVE_KEY, id)
  else localStorage.removeItem(ACTIVE_KEY)
  window.dispatchEvent(new Event('vari-conv-switch'))
}

export function createConversation(): Conversation {
  const conv: Conversation = {
    id: Date.now().toString(),
    title: 'New chat',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  const all = loadConversations()
  saveConversations([conv, ...all])
  setActiveId(conv.id)
  return conv
}

export function upsertConversation(conv: Conversation) {
  const all = loadConversations()
  const idx = all.findIndex(c => c.id === conv.id)
  if (idx >= 0) all[idx] = conv
  else all.unshift(conv)
  saveConversations(all)
}

export function deleteConversation(id: string) {
  const all = loadConversations().filter(c => c.id !== id)
  saveConversations(all)
  if (getActiveId() === id) {
    setActiveId(all[0]?.id ?? null)
  }
}

export function titleFromMessage(text: string): string {
  const clean = text.replace(/\[.*?\]/g, '').trim()
  return clean.slice(0, 48) || 'New chat'
}

export function timeLabel(ts: number): string {
  const now = Date.now()
  const diff = now - ts
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d}d ago`
  return new Date(ts).toLocaleDateString()
}
