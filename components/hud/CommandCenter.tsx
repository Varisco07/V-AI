'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderOpen, Bot, Plus, Trash2, X,
  Code2, Search, PenLine, Megaphone,
  MessageSquare, PenSquare, Files,
  FileText, Image as ImageIcon, Archive, File,
} from 'lucide-react'
import {
  Conversation, loadConversations, deleteConversation,
  getActiveId, setActiveId, createConversation, timeLabel,
} from '@/lib/conversations'
import { StoredFile, getFiles, removeFile, clearFiles, extIcon, timeAgo } from '@/lib/fileStore'
import { openPreview } from '@/lib/previewStore'

// ── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string; name: string; status: 'active' | 'idle' | 'completed'; progress: number; type: string
}

// Only persist id/active — icon must never go through JSON.stringify
interface Agent {
  id: string; name: string; description: string; color: string; active: boolean
}

// Icons kept purely in memory, keyed by agent id
const AGENT_ICONS: Record<string, typeof Code2> = {
  dev: Code2,
  research: Search,
  writer: PenLine,
  marketing: Megaphone,
}

const DEFAULT_AGENTS: Agent[] = [
  { id: 'dev', name: 'Developer', description: 'Code, debug, refactor', color: '#6366F1', active: false },
  { id: 'research', name: 'Researcher', description: 'Analysis, summaries', color: '#06B6D4', active: false },
  { id: 'writer', name: 'Writer', description: 'Writing, editing, docs', color: '#10B981', active: false },
  { id: 'marketing', name: 'Marketing', description: 'Copy, strategy, SEO', color: '#F59E0B', active: false },
]

const TABS = [
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'agents',   label: 'Agents',   icon: Bot },
  { id: 'files',    label: 'Files',    icon: Files },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function save(key: string, data: any) { localStorage.setItem(key, JSON.stringify(data)) }
function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function CommandCenter() {
  const [tab, setTab] = useState<'projects' | 'agents' | 'files'>('projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [showAddProject, setShowAddProject] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('Next.js')

  useEffect(() => {
    setProjects(load('vari-ai-projects', [{ id: '1', name: 'V-AI Platform', status: 'active', progress: 90, type: 'Next.js' }]))
    // Merge saved active-state with static defaults (never trust icon from storage)
    const savedAgents: Agent[] = load('vari-ai-agents', [])
    if (savedAgents.length > 0) {
      setAgents(DEFAULT_AGENTS.map(a => {
        const saved = savedAgents.find(s => s.id === a.id)
        return saved ? { ...a, active: saved.active } : a
      }))
    }
    setConversations(loadConversations())
    setActiveConvId(getActiveId())

    setStoredFiles(getFiles())

    const onUpdate = () => setConversations(loadConversations())
    const onSwitch = () => setActiveConvId(getActiveId())
    const onFilesUpdate = () => setStoredFiles(getFiles())
    window.addEventListener('vari-conv-update', onUpdate)
    window.addEventListener('vari-conv-switch', onSwitch)
    window.addEventListener('vari-files-update', onFilesUpdate)
    return () => {
      window.removeEventListener('vari-conv-update', onUpdate)
      window.removeEventListener('vari-conv-switch', onSwitch)
      window.removeEventListener('vari-files-update', onFilesUpdate)
    }
  }, [])

  const saveProjects = (d: Project[]) => { setProjects(d); save('vari-ai-projects', d) }
  const saveAgents = (d: Agent[]) => { setAgents(d); save('vari-ai-agents', d) }

  const addProject = () => {
    if (!newName.trim()) return
    saveProjects([...projects, { id: Date.now().toString(), name: newName.trim(), status: 'idle', progress: 0, type: newType }])
    setNewName(''); setShowAddProject(false)
  }

  const handleNewChat = () => {
    createConversation()
    setTab('projects') // switch to chat view
  }

  const handleSelectConv = (id: string) => {
    setActiveId(id)
  }

  const handleDeleteConv = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    deleteConversation(id)
  }

  const toggleAgent = (id: string) => {
    const updated = agents.map(a => ({ ...a, active: a.id === id ? !a.active : false }))
    saveAgents(updated)
  }

  return (
    <div className="h-full flex flex-col rounded-xl overflow-hidden"
      style={{ background: 'var(--vari-card)', border: '1px solid var(--vari-border)' }}>

      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: 'var(--vari-border)', background: 'rgba(99,102,241,0.03)' }}>
        <span className="text-sm font-semibold" style={{ color: 'var(--vari-light)' }}>Command Center</span>
        <button onClick={handleNewChat}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
          title="New chat"
          style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--vari-primary)', border: '1px solid rgba(99,102,241,0.2)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.2)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.12)'}>
          <PenSquare className="w-3.5 h-3.5" />
          New chat
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b shrink-0" style={{ borderColor: 'var(--vari-border)' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id as any)}
            className="flex-1 py-2.5 flex items-center justify-center gap-1 text-xs font-medium transition-all relative"
            style={{ color: tab === id ? 'var(--vari-primary)' : 'var(--vari-muted)' }}>
            <Icon className="w-3.5 h-3.5" />
            {label}
            {tab === id && (
              <motion.div layoutId="cc-tab" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                style={{ background: 'var(--vari-primary)' }} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="wait">

          {/* ── PROJECTS ── */}
          {tab === 'projects' && (
            <motion.div key="projects" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
              {projects.map(p => (
                <ProjectCard key={p.id} project={p}
                  onDelete={id => saveProjects(projects.filter(x => x.id !== id))}
                  onProgress={(id, val) => saveProjects(projects.map(x => x.id === id ? { ...x, progress: val, status: val === 100 ? 'completed' : 'active' } : x))} />
              ))}
              {showAddProject ? (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  className="p-3 rounded-lg space-y-2"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
                  <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addProject()} placeholder="Project name…"
                    className="w-full rounded-md px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--vari-darker)', border: '1px solid var(--vari-border)', color: 'var(--vari-light)' }} />
                  <select value={newType} onChange={e => setNewType(e.target.value)}
                    className="w-full rounded-md px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--vari-darker)', border: '1px solid var(--vari-border)', color: 'var(--vari-light)' }}>
                    {['Next.js','React','Node.js','Python','Rust','Other'].map(o => <option key={o}>{o}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={addProject} className="flex-1 py-1.5 rounded-md text-xs font-semibold text-white"
                      style={{ background: 'var(--vari-primary)' }}>Add</button>
                    <button onClick={() => setShowAddProject(false)} className="px-3 py-1.5 rounded-md text-xs"
                      style={{ background: 'var(--vari-darker)', color: 'var(--vari-muted)', border: '1px solid var(--vari-border)' }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <button onClick={() => setShowAddProject(true)}
                  className="w-full py-2.5 rounded-lg border-dashed border flex items-center justify-center gap-1.5 text-xs font-medium hover:opacity-80 transition-opacity"
                  style={{ borderColor: 'var(--vari-border)', color: 'var(--vari-muted)' }}>
                  <Plus className="w-3.5 h-3.5" /> New Project
                </button>
              )}
            </motion.div>
          )}

          {/* ── AGENTS ── */}
          {tab === 'agents' && (
            <motion.div key="agents" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
              <p className="text-[10px] px-1 pb-1" style={{ color: 'var(--vari-muted)' }}>
                Seleziona un agente per personalizzare il comportamento dell'AI.
              </p>
              {agents.map(agent => (
                <AgentCard key={agent.id} agent={agent} onToggle={() => toggleAgent(agent.id)} />
              ))}
              {agents.some(a => a.active) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mt-2 px-3 py-2 rounded-lg text-xs"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--vari-primary)' }}>
                  Agent active — the AI will adapt its behavior accordingly.
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── FILES ── */}
          {tab === 'files' && (
            <motion.div key="files" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Filter buttons */}
              <div className="flex gap-1.5 mb-3">
                {(['all','uploaded','generated'] as const).map(f => (
                  <FileFilterBtn key={f} label={f === 'all' ? 'Tutti' : f === 'uploaded' ? 'Caricati' : 'Generati'}
                    files={storedFiles} filter={f} />
                ))}
                {storedFiles.length > 0 && (
                  <button onClick={() => clearFiles()}
                    className="ml-auto text-[10px] transition-opacity hover:opacity-70"
                    style={{ color: 'var(--vari-error)' }}>Svuota</button>
                )}
              </div>

              {storedFiles.length === 0 ? (
                <div className="text-center py-10">
                  <Files className="w-8 h-8 mx-auto mb-3 opacity-20" style={{ color: 'var(--vari-muted)' }} />
                  <p className="text-xs" style={{ color: 'var(--vari-muted)' }}>
                    Nessun file ancora.<br />Carica un PDF o genera codice.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {storedFiles.map(file => (
                    <FileRow key={file.id} file={file} onDelete={() => removeFile(file.id)} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProjectCard({ project, onDelete, onProgress }: {
  project: Project
  onDelete: (id: string) => void
  onProgress: (id: string, val: number) => void
}) {
  const dot = { active: '#10B981', idle: '#F59E0B', completed: '#6366F1' }
  return (
    <div className="p-3 rounded-lg group transition-all"
      style={{ background: 'var(--vari-hover)', border: '1px solid var(--vari-border)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.3)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--vari-border)'}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: dot[project.status], boxShadow: `0 0 4px ${dot[project.status]}88` }} />
          <span className="text-xs font-medium" style={{ color: 'var(--vari-light)' }}>{project.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: 'var(--vari-hover)', color: 'var(--vari-muted)' }}>{project.type}</span>
          <button onClick={() => onDelete(project.id)} className="opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--vari-error)' }}>
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px]" style={{ color: 'var(--vari-muted)' }}>Progress</span>
        <span className="text-[10px] font-mono font-semibold" style={{ color: 'var(--vari-primary)' }}>{project.progress}%</span>
      </div>
      <div className="w-full h-1 rounded-full mb-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #6366F1, #06B6D4)' }}
          initial={{ width: 0 }} animate={{ width: `${project.progress}%` }} transition={{ duration: 0.4 }} />
      </div>
      {project.progress < 100 && (
        <div className="grid grid-cols-4 gap-1">
          {[25,50,75,100].map(v => (
            <button key={v} onClick={() => onProgress(project.id, v)}
              className="py-1 text-[10px] rounded font-mono transition-colors"
              style={{ background: 'var(--vari-hover)', color: 'var(--vari-muted)' }}
              onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(99,102,241,0.15)'; (e.target as HTMLElement).style.color = 'var(--vari-primary)' }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = 'var(--vari-hover)'; (e.target as HTMLElement).style.color = 'var(--vari-muted)' }}>
              {v}%
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── File Manager sub-components ──────────────────────────────────────────────

function FileFilterBtn({ label, files, filter }: {
  label: string
  files: StoredFile[]
  filter: 'all' | 'uploaded' | 'generated'
}) {
  const count = filter === 'all' ? files.length : files.filter(f => f.type === filter).length
  return (
    <span className="px-2 py-1 rounded-md text-[10px] font-medium"
      style={{ background: 'var(--vari-hover)', color: 'var(--vari-muted)', border: '1px solid var(--vari-border)' }}>
      {label} <span style={{ color: 'var(--vari-primary)' }}>{count}</span>
    </span>
  )
}

function FileRow({ file, onDelete }: { file: StoredFile; onDelete: () => void }) {
  const canPreview = ['html','htm','js','ts','py','css','json','md','txt'].includes(file.ext)
  const isImage = ['png','jpg','jpeg','gif','webp','svg'].includes(file.ext)

  const handleClick = () => {
    if (!canPreview || !file.content) return
    if (file.ext === 'html' || file.ext === 'htm') {
      openPreview({ title: file.name, html: file.content })
    } else {
      openPreview({ title: file.name, code: file.content, lang: file.ext })
    }
  }

  const typeBadge = file.type === 'uploaded'
    ? { label: 'up', color: '#06b6d4' }
    : file.type === 'generated'
      ? { label: 'gen', color: '#6366f1' }
      : { label: 'game', color: '#f59e0b' }

  return (
    <div className="group flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all cursor-pointer"
      style={{ border: '1px solid transparent' }}
      onClick={handleClick}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--vari-hover)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--vari-border)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent' }}>
      <span className="text-base shrink-0">{extIcon(file.ext)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: 'var(--vari-light)' }}>{file.name}</p>
        <p className="text-[9px]" style={{ color: 'var(--vari-muted)' }}>
          {file.size > 1000 ? `${(file.size/1000).toFixed(1)}k` : `${file.size}b`} · {timeAgo(file.timestamp)}
        </p>
      </div>
      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0"
        style={{ background: `${typeBadge.color}18`, color: typeBadge.color }}>
        {typeBadge.label}
      </span>
      <button onClick={e => { e.stopPropagation(); onDelete() }}
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        style={{ color: 'var(--vari-error)' }}>
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

const AGENT_PERSONALITIES: Record<string, string> = {
  dev:       'Risponde in modo tecnico e conciso, con esempi di codice',
  research:  'Analizza in profondità, struttura con sezioni e bullet point',
  writer:    'Scrive in modo fluido e professionale, pronto per pubblicare',
  marketing: 'Tono persuasivo ed energico, focalizzato sui benefici',
}

function AgentCard({ agent, onToggle }: { agent: Agent; onToggle: () => void }) {
  const Icon = AGENT_ICONS[agent.id] ?? Code2
  const personality = AGENT_PERSONALITIES[agent.id] || ''
  const status = agent.active ? 'Attivo' : 'Standby'

  return (
    <motion.div onClick={onToggle} whileTap={{ scale: 0.99 }}
      className="p-3 rounded-xl cursor-pointer transition-all"
      style={{
        background: agent.active ? `${agent.color}12` : 'var(--vari-hover)',
        border: `1px solid ${agent.active ? agent.color + '55' : 'var(--vari-border)'}`,
        boxShadow: agent.active ? `0 0 12px ${agent.color}18` : 'none',
      }}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: agent.active ? `${agent.color}25` : 'rgba(255,255,255,0.06)',
            border: `1px solid ${agent.active ? agent.color + '55' : 'var(--vari-border)'}`,
          }}>
          <Icon className="w-4 h-4" style={{ color: agent.active ? agent.color : 'var(--vari-muted)' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {/* Status dot */}
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
              background: agent.active ? agent.color : 'var(--vari-muted)',
              boxShadow: agent.active ? `0 0 6px ${agent.color}` : 'none',
            }} />
            <span className="text-xs font-semibold" style={{ color: agent.active ? agent.color : 'var(--vari-light)' }}>
              {agent.name} Agent
            </span>
            <span className="text-[9px] ml-auto" style={{ color: agent.active ? agent.color : 'var(--vari-muted)' }}>
              {status}
            </span>
          </div>
          <p className="text-[10px] leading-relaxed" style={{ color: 'var(--vari-muted)' }}>{personality}</p>
        </div>
      </div>
    </motion.div>
  )
}
