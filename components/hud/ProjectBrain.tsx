'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, FolderOpen, ListTodo, Bug, FileText, Network,
  Plus, RefreshCw, X, ChevronDown,
} from 'lucide-react'

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface Project {
  id: string
  name: string
  status: string
  tech_stack: string[]
  stats: {
    fileCount: number; symbolCount: number; taskCount: number
    bugCount: number; chunkCount: number; nodeCount: number
  }
}
interface Task {
  id: string; title: string; type: string
  status: string; priority: number; description?: string
}
interface BugItem {
  id: string; title: string; severity: string
  status: string; description?: string
}
type Tab = 'overview' | 'tasks' | 'bugs' | 'decisions'

// ── Helpers UI ────────────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold capitalize"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {label}
    </span>
  )
}

function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--vari-border)' }}>
      <span className="text-sm font-bold" style={{ color: 'var(--vari-primary)' }}>{value}</span>
      <span className="text-[9px] uppercase tracking-wide" style={{ color: 'var(--vari-muted)' }}>{label}</span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ProjectBrain() {
  const [isOpen,            setIsOpen]            = useState(false)
  const [activeTab,         setActiveTab]          = useState<Tab>('overview')
  const [projects,          setProjects]           = useState<Project[]>([])
  const [activeProject,     setActiveProject]      = useState<Project | null>(null)
  const [tasks,             setTasks]              = useState<Task[]>([])
  const [bugs,              setBugs]               = useState<BugItem[]>([])
  const [loading,           setLoading]            = useState(false)
  const [showCreateProject, setShowCreateProject]  = useState(false)
  const [showCreateTask,    setShowCreateTask]      = useState(false)

  // form state
  const [newProjectName,  setNewProjectName]  = useState('')
  const [newProjectStack, setNewProjectStack] = useState('')
  const [newTaskTitle,    setNewTaskTitle]    = useState('')
  const [newTaskDesc,     setNewTaskDesc]     = useState('')
  const [newTaskType,     setNewTaskType]     = useState('feature')
  const [newTaskPriority, setNewTaskPriority] = useState('3')

  useEffect(() => { loadProjects() }, [])
  useEffect(() => {
    if (activeProject) { loadTasks(activeProject.id); loadBugs(activeProject.id) }
  }, [activeProject])

  const loadProjects = async () => {
    try {
      const data = await fetch('/api/brain/project').then(r => r.json())
      const list = (data.projects || []).map((p: any) => ({
        ...p,
        stats: p.stats || { fileCount:0, symbolCount:0, taskCount:0, bugCount:0, chunkCount:0, nodeCount:0 }
      }))
      setProjects(list)
      if (list.length > 0 && !activeProject) setActiveProject(list[0])
    } catch {}
  }

  const loadTasks = async (id: string) => {
    try { const d = await fetch(`/api/brain/tasks?projectId=${id}`).then(r=>r.json()); setTasks(d.tasks||[]) } catch {}
  }
  const loadBugs = async (id: string) => {
    try { const d = await fetch(`/api/brain/bugs?projectId=${id}`).then(r=>r.json()); setBugs(d.bugs||[]) } catch {}
  }

  const indexProject = async () => {
    if (!activeProject) return
    const rootPath = prompt('Percorso root del progetto:')
    if (!rootPath) return
    setLoading(true)
    try {
      const d = await fetch('/api/brain/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: activeProject.id, rootPath, enableSummaries: false }),
      }).then(r => r.json())
      alert(`Indicizzati ${d.result.filesIndexed} file in ${(d.result.timeElapsed/1000).toFixed(1)}s`)
      loadProjects()
    } catch { alert('Indicizzazione fallita') }
    finally { setLoading(false) }
  }

  const createProject = async () => {
    if (!newProjectName.trim()) return
    try {
      const techStack = newProjectStack.split(',').map(t=>t.trim()).filter(Boolean)
      const d = await fetch('/api/brain/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName.trim(), tech_stack: techStack, status: 'active', meta: {} }),
      }).then(r => r.json())
      const np = { ...d.project, stats: { fileCount:0, symbolCount:0, taskCount:0, bugCount:0, chunkCount:0, nodeCount:0 } }
      setProjects(p => [...p, np])
      setActiveProject(np)
      setShowCreateProject(false)
      setNewProjectName(''); setNewProjectStack('')
    } catch { alert('Errore creazione progetto') }
  }

  const createTask = async () => {
    if (!activeProject || !newTaskTitle.trim()) return
    try {
      await fetch('/api/brain/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: activeProject.id,
          title: newTaskTitle.trim(),
          description: newTaskDesc,
          type: newTaskType,
          priority: parseInt(newTaskPriority),
          assigned_to: 'ai',
          status: 'open',
          related_files: [],
        }),
      })
      loadTasks(activeProject.id)
      setShowCreateTask(false)
      setNewTaskTitle(''); setNewTaskDesc('')
    } catch { alert('Errore creazione task') }
  }

  // ── Input style ─────────────────────────────────────────────────────────────
  const inputStyle = {
    background: 'var(--vari-input-bg)',
    border: '1px solid var(--vari-border)',
    borderRadius: 8,
    color: 'var(--vari-light)',
    padding: '7px 10px',
    fontSize: 12,
    width: '100%',
    outline: 'none',
  } as React.CSSProperties

  const selectStyle = { ...inputStyle }

  // ── Floating button ──────────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{
          background: 'var(--vari-card)',
          border: '1px solid var(--vari-border)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          color: 'var(--vari-primary)',
        }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
      >
        <Brain className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold">Brain</span>
      </motion.button>
    )
  }

  // ── Panel ────────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ x: -420, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -420, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      className="fixed left-0 top-0 h-screen w-[380px] z-50 flex flex-col"
      style={{
        background: 'var(--vari-surface)',
        borderRight: '1px solid var(--vari-border)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--vari-border)', background: 'var(--vari-card)' }}>
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" style={{ color: 'var(--vari-primary)' }} />
          <span className="text-sm font-bold" style={{ color: 'var(--vari-light)' }}>Project Brain</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--vari-primary)', border: '1px solid rgba(99,102,241,0.2)' }}>
            BETA
          </span>
        </div>
        <button onClick={() => setIsOpen(false)}
          className="p-1.5 rounded-lg"
          style={{ color: 'var(--vari-muted)', border: '1px solid transparent' }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Project selector ────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3 border-b space-y-2"
        style={{ borderColor: 'var(--vari-border)' }}>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <select
              value={activeProject?.id || ''}
              onChange={e => setActiveProject(projects.find(p => p.id === e.target.value) || null)}
              style={{ ...selectStyle, paddingRight: 28 }}
            >
              {projects.length === 0 && <option>Nessun progetto</option>}
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
              style={{ color: 'var(--vari-muted)' }} />
          </div>
          <button onClick={() => setShowCreateProject(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0"
            style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--vari-primary)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Plus className="w-3 h-3" /> Nuovo
          </button>
        </div>

        {/* Stats row */}
        {activeProject && (
          <div className="grid grid-cols-3 gap-1.5">
            <StatCard value={activeProject.stats.fileCount}  label="File"  />
            <StatCard value={activeProject.stats.taskCount}  label="Task"  />
            <StatCard value={activeProject.stats.bugCount}   label="Bug"   />
          </div>
        )}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex gap-0.5 px-3 py-2 border-b"
        style={{ borderColor: 'var(--vari-border)' }}>
        {([
          { id: 'overview',   icon: Brain,    label: 'Overview'   },
          { id: 'tasks',      icon: ListTodo, label: 'Task'       },
          { id: 'bugs',       icon: Bug,      label: 'Bug'        },
          { id: 'decisions',  icon: FileText, label: 'Decisioni'  },
        ] as { id: Tab; icon: any; label: string }[]).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium"
            style={
              activeTab === tab.id
                ? { background: 'rgba(99,102,241,0.12)', color: 'var(--vari-primary)', border: '1px solid rgba(99,102,241,0.2)' }
                : { background: 'transparent', color: 'var(--vari-muted)', border: '1px solid transparent' }
            }>
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">

        {/* Overview */}
        {activeTab === 'overview' && activeProject && (
          <div className="space-y-3">
            {/* Info card */}
            <div className="rounded-xl p-3 space-y-2"
              style={{ background: 'var(--vari-card)', border: '1px solid var(--vari-border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: 'var(--vari-light)' }}>
                  {activeProject.name}
                </span>
                <Badge
                  label={activeProject.status}
                  color={activeProject.status === 'active' ? '#10B981' : '#6B6B8A'}
                />
              </div>
              {activeProject.tech_stack.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {activeProject.tech_stack.map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--vari-muted)', border: '1px solid var(--vari-border)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Detailed stats */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Simboli',      value: activeProject.stats.symbolCount },
                { label: 'Chunk RAG',    value: activeProject.stats.chunkCount  },
                { label: 'Nodi grafo',   value: activeProject.stats.nodeCount   },
                { label: 'Task totali',  value: activeProject.stats.taskCount   },
              ].map(s => (
                <div key={s.label} className="rounded-lg px-3 py-2"
                  style={{ background: 'var(--vari-card)', border: '1px solid var(--vari-border)' }}>
                  <div className="text-xs font-bold font-mono" style={{ color: 'var(--vari-primary)' }}>{s.value}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--vari-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Index button */}
            <button onClick={indexProject} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-50"
              style={{
                background: 'rgba(99,102,241,0.12)',
                color: 'var(--vari-primary)',
                border: '1px solid rgba(99,102,241,0.25)',
              }}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Indicizzazione…' : 'Indicizza Progetto'}
            </button>
          </div>
        )}

        {activeTab === 'overview' && !activeProject && (
          <p className="text-xs text-center py-8" style={{ color: 'var(--vari-muted)' }}>
            Nessun progetto selezionato.
          </p>
        )}

        {/* Tasks */}
        {activeTab === 'tasks' && (
          <div className="space-y-2">
            <button onClick={() => setShowCreateTask(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium"
              style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--vari-primary)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <Plus className="w-3 h-3" /> Nuova Task
            </button>

            {tasks.length === 0 && (
              <p className="text-xs text-center py-6" style={{ color: 'var(--vari-muted)' }}>Nessuna task.</p>
            )}

            {tasks.map(task => (
              <div key={task.id} className="rounded-xl p-3 space-y-2"
                style={{ background: 'var(--vari-card)', border: '1px solid var(--vari-border)' }}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold leading-tight flex-1"
                    style={{ color: 'var(--vari-light)' }}>{task.title}</span>
                  <Badge
                    label={`P${task.priority}`}
                    color={task.priority <= 2 ? '#EF4444' : task.priority === 3 ? '#F59E0B' : '#6366F1'}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge label={task.type}   color="#6366F1" />
                  <Badge
                    label={task.status.replace('_', ' ')}
                    color={task.status === 'done' ? '#10B981' : task.status === 'in_progress' ? '#F59E0B' : '#6B6B8A'}
                  />
                </div>
                {task.description && (
                  <p className="text-[10px] leading-relaxed"
                    style={{ color: 'var(--vari-muted)' }}>{task.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bugs */}
        {activeTab === 'bugs' && (
          <div className="space-y-2">
            {bugs.length === 0 && (
              <p className="text-xs text-center py-6" style={{ color: 'var(--vari-muted)' }}>Nessun bug registrato.</p>
            )}
            {bugs.map(bug => (
              <div key={bug.id} className="rounded-xl p-3 space-y-2"
                style={{ background: 'var(--vari-card)', border: '1px solid var(--vari-border)' }}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold leading-tight flex-1"
                    style={{ color: 'var(--vari-light)' }}>{bug.title}</span>
                  <Badge
                    label={bug.severity}
                    color={bug.severity === 'critical' ? '#EF4444' : bug.severity === 'high' ? '#F97316' : bug.severity === 'medium' ? '#F59E0B' : '#6366F1'}
                  />
                </div>
                <Badge
                  label={bug.status}
                  color={bug.status === 'fixed' ? '#10B981' : bug.status === 'open' ? '#EF4444' : '#6B6B8A'}
                />
                {bug.description && (
                  <p className="text-[10px]" style={{ color: 'var(--vari-muted)' }}>{bug.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Decisions — placeholder */}
        {activeTab === 'decisions' && (
          <p className="text-xs text-center py-8" style={{ color: 'var(--vari-muted)' }}>
            Nessuna decisione registrata.
          </p>
        )}
      </div>

      {/* ── Modal: Create Project ────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateProject && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full rounded-2xl p-5 space-y-4"
              style={{ background: 'var(--vari-card)', border: '1px solid var(--vari-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: 'var(--vari-light)' }}>Nuovo Progetto</span>
                <button onClick={() => setShowCreateProject(false)}>
                  <X className="w-4 h-4" style={{ color: 'var(--vari-muted)' }} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--vari-muted)' }}>
                    Nome progetto
                  </label>
                  <input style={inputStyle} value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    placeholder="V-AI Platform" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--vari-muted)' }}>
                    Tech stack (separati da virgola)
                  </label>
                  <input style={inputStyle} value={newProjectStack}
                    onChange={e => setNewProjectStack(e.target.value)}
                    placeholder="Next.js, TypeScript, Tailwind" />
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowCreateProject(false)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--vari-muted)', border: '1px solid var(--vari-border)' }}>
                  Annulla
                </button>
                <button onClick={createProject}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--vari-primary)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  Crea
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal: Create Task ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateTask && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full rounded-2xl p-5 space-y-3"
              style={{ background: 'var(--vari-card)', border: '1px solid var(--vari-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: 'var(--vari-light)' }}>Nuova Task</span>
                <button onClick={() => setShowCreateTask(false)}>
                  <X className="w-4 h-4" style={{ color: 'var(--vari-muted)' }} />
                </button>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--vari-muted)' }}>Titolo</label>
                <input style={inputStyle} value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)} placeholder="Implementa feature X" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--vari-muted)' }}>Descrizione</label>
                <textarea style={{ ...inputStyle, resize: 'none' } as React.CSSProperties}
                  rows={3} value={newTaskDesc}
                  onChange={e => setNewTaskDesc(e.target.value)} placeholder="Dettagli opzionali…" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--vari-muted)' }}>Tipo</label>
                  <select style={selectStyle} value={newTaskType} onChange={e => setNewTaskType(e.target.value)}>
                    <option value="feature">Feature</option>
                    <option value="bug">Bug</option>
                    <option value="refactor">Refactor</option>
                    <option value="test">Test</option>
                    <option value="doc">Doc</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--vari-muted)' }}>Priorità</label>
                  <select style={selectStyle} value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value)}>
                    <option value="1">1 — Critica</option>
                    <option value="2">2 — Alta</option>
                    <option value="3">3 — Media</option>
                    <option value="4">4 — Bassa</option>
                    <option value="5">5 — Triviale</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowCreateTask(false)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--vari-muted)', border: '1px solid var(--vari-border)' }}>
                  Annulla
                </button>
                <button onClick={createTask}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--vari-primary)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  Crea
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}