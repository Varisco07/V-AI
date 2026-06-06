'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, FolderOpen, ListTodo, Bug, FileText, Network, 
  Plus, RefreshCw, Search, ChevronRight, X 
} from 'lucide-react'

interface Project {
  id: string
  name: string
  status: string
  tech_stack: string[]
  stats: {
    fileCount: number
    symbolCount: number
    taskCount: number
    bugCount: number
    chunkCount: number
    nodeCount: number
  }
}

interface Task {
  id: string
  title: string
  type: string
  status: string
  priority: number
  description?: string
}

interface Bug {
  id: string
  title: string
  severity: string
  status: string
  description?: string
}

type Tab = 'overview' | 'files' | 'tasks' | 'bugs' | 'decisions' | 'graph'

export default function ProjectBrain() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [bugs, setBugs] = useState<Bug[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (activeProject) {
      loadTasks(activeProject.id)
      loadBugs(activeProject.id)
    }
  }, [activeProject])

  const loadProjects = async () => {
    try {
      const res = await fetch('/api/brain/project')
      const data = await res.json()
      const projectsWithStats = (data.projects || []).map((p: any) => ({
        ...p,
        stats: p.stats || {
          fileCount: 0,
          symbolCount: 0,
          taskCount: 0,
          bugCount: 0,
          chunkCount: 0,
          nodeCount: 0,
        }
      }))
      setProjects(projectsWithStats)
      if (projectsWithStats.length > 0 && !activeProject) {
        setActiveProject(projectsWithStats[0])
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const loadTasks = async (projectId: string) => {
    try {
      const res = await fetch(`/api/brain/tasks?projectId=${projectId}`)
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  const loadBugs = async (projectId: string) => {
    try {
      const res = await fetch(`/api/brain/bugs?projectId=${projectId}`)
      const data = await res.json()
      setBugs(data.bugs || [])
    } catch (error) {
      console.error('Error loading bugs:', error)
    }
  }

  const indexProject = async () => {
    if (!activeProject) return
    
    const rootPath = prompt('Enter project root path:')
    if (!rootPath) return

    setLoading(true)
    try {
      const res = await fetch('/api/brain/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject.id,
          rootPath,
          enableSummaries: false,
        }),
      })
      const data = await res.json()
      alert(`Indexed ${data.result.filesIndexed} files, ${data.result.chunksCreated} chunks in ${(data.result.timeElapsed / 1000).toFixed(1)}s`)
      loadProjects()
    } catch (error) {
      alert('Indexing failed: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (name: string, techStack: string[]) => {
    try {
      const res = await fetch('/api/brain/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, tech_stack: techStack, status: 'active', meta: {} }),
      })
      const data = await res.json()
      
      // Add default stats to new project
      const newProject = {
        ...data.project,
        stats: {
          fileCount: 0,
          symbolCount: 0,
          taskCount: 0,
          bugCount: 0,
          chunkCount: 0,
          nodeCount: 0,
        }
      }
      
      setProjects([...projects, newProject])
      setActiveProject(newProject)
      setShowCreateProject(false)
    } catch (error) {
      alert('Failed to create project: ' + error)
    }
  }

  const createTask = async (title: string, description: string, type: string, priority: number) => {
    if (!activeProject) return

    try {
      await fetch('/api/brain/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: activeProject.id,
          title,
          description,
          type,
          priority,
          assigned_to: 'ai',
          status: 'open',
          related_files: [],
        }),
      })
      loadTasks(activeProject.id)
      setShowCreateTask(false)
    } catch (error) {
      alert('Failed to create task: ' + error)
    }
  }

  if (!isOpen) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-20 z-50 group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-75 blur-xl group-hover:opacity-100 transition-opacity" />
          
          {/* Button */}
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-purple-600/30 to-pink-600/20 backdrop-blur-xl border border-purple-400/30 shadow-2xl">
            <Brain className="w-7 h-7 text-purple-300 group-hover:text-purple-200 transition-colors" />
          </div>

          {/* Pulse animation */}
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/50 animate-ping" />
        </div>
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed left-0 top-0 h-screen w-[420px] z-50 flex flex-col"
    >
      {/* Glassmorphism background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/95 via-slate-950/95 to-pink-950/95 backdrop-blur-2xl" />
      
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 animate-pulse" />
      
      {/* Border glow */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-purple-500 to-transparent" />

      {/* Content */}
      <div className="relative flex flex-col h-full">
        {/* Header with glass effect */}
        <div className="p-6 border-b border-purple-500/20 backdrop-blur-xl bg-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30">
                <Brain className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
                  Project Brain
                </h2>
                <p className="text-xs text-purple-400/70">AI Memory System</p>
              </div>
            </div>
            <motion.button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors border border-transparent hover:border-purple-400/30"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5 text-purple-300" />
            </motion.button>
          </div>
          {/* Project Selector */}
          <div className="space-y-2">
            <select
              value={activeProject?.id || ''}
              onChange={(e) => {
                const proj = projects.find(p => p.id === e.target.value)
                setActiveProject(proj || null)
              }}
              className="w-full bg-purple-950/50 border border-purple-400/30 rounded-xl px-4 py-3 text-purple-100 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all backdrop-blur-xl"
            >
              {projects.length === 0 && <option>No projects</option>}
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <motion.button
              onClick={() => setShowCreateProject(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/40 hover:to-pink-600/40 border border-purple-400/30 rounded-xl text-purple-100 font-medium transition-all backdrop-blur-xl shadow-lg shadow-purple-500/10"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              New Project
            </motion.button>
          </div>
        </div>

        {/* Stats */}
        {activeProject && activeProject.stats && (
          <div className="p-6 border-b border-purple-500/20 bg-white/5 backdrop-blur-xl">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Files', value: activeProject.stats.fileCount || 0, icon: '📁', gradient: 'from-blue-500/20 to-cyan-500/20' },
                { label: 'Tasks', value: activeProject.stats.taskCount || 0, icon: '✅', gradient: 'from-green-500/20 to-emerald-500/20' },
                { label: 'Bugs', value: activeProject.stats.bugCount || 0, icon: '🐛', gradient: 'from-red-500/20 to-pink-500/20' },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${stat.gradient} backdrop-blur-xl border border-white/10 p-3 group hover:scale-105 transition-transform`}
                  whileHover={{ y: -2 }}
                >
                  <div className="absolute top-0 right-0 text-4xl opacity-10 group-hover:opacity-20 transition-opacity">
                    {stat.icon}
                  </div>
                  <div className="relative">
                    <div className="text-xs text-purple-300/70 font-medium mb-1">{stat.label}</div>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-purple-500/20 overflow-x-auto bg-white/5 backdrop-blur-xl">
          <div className="flex gap-2">
            {[
              { id: 'overview', icon: Brain, label: 'Overview' },
              { id: 'files', icon: FolderOpen, label: 'Files' },
              { id: 'tasks', icon: ListTodo, label: 'Tasks' },
              { id: 'bugs', icon: Bug, label: 'Bugs' },
              { id: 'decisions', icon: FileText, label: 'Decisions' },
              { id: 'graph', icon: Network, label: 'Graph' },
            ].map(tab => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-purple-300/70 hover:text-purple-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-purple-600/40 to-pink-600/40 rounded-lg border border-purple-400/30"
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  />
                )}
                <tab.icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
          {activeTab === 'overview' && activeProject && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Project Info Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-950/50 to-pink-950/30 backdrop-blur-xl border border-purple-400/20 shadow-xl">
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent mb-3">
                  {activeProject.name}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400/70">Tech Stack:</span>
                    <span className="text-purple-200">{activeProject.tech_stack.join(', ') || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400/70">Status:</span>
                    <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-300 text-xs font-medium capitalize">
                      {activeProject.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Index Button */}
              <motion.button
                onClick={indexProject}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-white font-bold text-lg transition-all shadow-lg shadow-purple-500/30 border border-purple-400/30"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Indexing...' : 'Index Project'}
              </motion.button>

              {/* Detailed Stats */}
              {activeProject.stats && (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Symbols', value: activeProject.stats.symbolCount || 0, icon: '🔤', color: 'purple' },
                    { label: 'Chunks', value: activeProject.stats.chunkCount || 0, icon: '📦', color: 'blue' },
                    { label: 'Nodes', value: activeProject.stats.nodeCount || 0, icon: '🕸️', color: 'pink' },
                    { label: 'Dependencies', value: '-', icon: '🔗', color: 'cyan' },
                  ].map((stat) => (
                    <motion.div
                      key={stat.label}
                      className="p-4 rounded-xl bg-gradient-to-br from-purple-950/40 to-slate-950/40 backdrop-blur-xl border border-purple-400/20 hover:border-purple-400/40 transition-all"
                      whileHover={{ scale: 1.05, y: -2 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-purple-300/70 font-medium">{stat.label}</span>
                        <span className="text-xl">{stat.icon}</span>
                      </div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
                        {stat.value}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'tasks' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <motion.button
                onClick={() => setShowCreateTask(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/40 hover:to-pink-600/40 border border-purple-400/30 rounded-xl text-purple-100 font-medium transition-all backdrop-blur-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-4 h-4" />
                New Task
              </motion.button>

              {tasks.map(task => (
                <motion.div
                  key={task.id}
                  className="p-4 rounded-xl bg-gradient-to-br from-purple-950/40 to-slate-950/40 backdrop-blur-xl border border-purple-400/20 hover:border-purple-400/40 transition-all group"
                  whileHover={{ scale: 1.02, y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-sm font-semibold text-purple-100 group-hover:text-white transition-colors flex-1">
                      {task.title}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-lg font-bold whitespace-nowrap ${
                      task.priority <= 2 ? 'bg-red-500/20 text-red-300 border border-red-400/30' :
                      task.priority === 3 ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' :
                      'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                    }`}>
                      P{task.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mb-2">
                    <span className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 capitalize font-medium">
                      {task.type}
                    </span>
                    <span className={`px-2 py-1 rounded-lg font-medium capitalize ${
                      task.status === 'done' ? 'bg-green-500/20 text-green-300' :
                      task.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-purple-500/20 text-purple-300'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-purple-300/70 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'bugs' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {bugs.map(bug => (
                <motion.div
                  key={bug.id}
                  className="p-4 rounded-xl bg-gradient-to-br from-purple-950/40 to-slate-950/40 backdrop-blur-xl border border-purple-400/20 hover:border-purple-400/40 transition-all"
                  whileHover={{ scale: 1.02, y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-sm font-semibold text-purple-100 flex-1">{bug.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-lg font-bold whitespace-nowrap border ${
                      bug.severity === 'critical' ? 'bg-red-600/30 text-red-200 border-red-400/50' :
                      bug.severity === 'high' ? 'bg-orange-500/30 text-orange-200 border-orange-400/50' :
                      bug.severity === 'medium' ? 'bg-yellow-500/30 text-yellow-200 border-yellow-400/50' :
                      'bg-blue-500/30 text-blue-200 border-blue-400/50'
                    }`}>
                      {bug.severity}
                    </span>
                  </div>
                  <span className={`inline-block text-xs px-2 py-1 rounded-lg font-medium capitalize ${
                    bug.status === 'fixed' ? 'bg-green-500/20 text-green-300 border border-green-400/30' :
                    bug.status === 'open' ? 'bg-red-500/20 text-red-300 border border-red-400/30' :
                    'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                  }`}>
                    {bug.status}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-purple-950 border border-purple-500/30 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-purple-100 mb-4">Create Project</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.target as HTMLFormElement
                const name = (form.elements.namedItem('name') as HTMLInputElement).value
                const techStack = (form.elements.namedItem('tech_stack') as HTMLInputElement).value
                  .split(',')
                  .map(t => t.trim())
                  .filter(Boolean)
                createProject(name, techStack)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-purple-300 mb-1">Project Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full bg-purple-950/50 border border-purple-500/30 rounded px-3 py-2 text-purple-100 focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-sm text-purple-300 mb-1">Tech Stack (comma-separated)</label>
                <input
                  type="text"
                  name="tech_stack"
                  placeholder="Next.js, TypeScript, Tailwind"
                  className="w-full bg-purple-950/50 border border-purple-500/30 rounded px-3 py-2 text-purple-100 focus:outline-none focus:border-purple-400"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateProject(false)}
                  className="flex-1 px-4 py-2 bg-purple-950/50 border border-purple-500/30 rounded text-purple-300 hover:bg-purple-900/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white font-medium transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTask && activeProject && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-purple-950 border border-purple-500/30 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-purple-100 mb-4">Create Task</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.target as HTMLFormElement
                const title = (form.elements.namedItem('title') as HTMLInputElement).value
                const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value
                const type = (form.elements.namedItem('type') as HTMLSelectElement).value
                const priority = parseInt((form.elements.namedItem('priority') as HTMLSelectElement).value)
                createTask(title, description, type, priority)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-purple-300 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full bg-purple-950/50 border border-purple-500/30 rounded px-3 py-2 text-purple-100 focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-sm text-purple-300 mb-1">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full bg-purple-950/50 border border-purple-500/30 rounded px-3 py-2 text-purple-100 focus:outline-none focus:border-purple-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-purple-300 mb-1">Type</label>
                  <select
                    name="type"
                    className="w-full bg-purple-950/50 border border-purple-500/30 rounded px-3 py-2 text-purple-100 focus:outline-none focus:border-purple-400"
                  >
                    <option value="feature">Feature</option>
                    <option value="bug">Bug</option>
                    <option value="refactor">Refactor</option>
                    <option value="test">Test</option>
                    <option value="doc">Doc</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-purple-300 mb-1">Priority</label>
                  <select
                    name="priority"
                    className="w-full bg-purple-950/50 border border-purple-500/30 rounded px-3 py-2 text-purple-100 focus:outline-none focus:border-purple-400"
                  >
                    <option value="1">1 - Critical</option>
                    <option value="2">2 - High</option>
                    <option value="3">3 - Medium</option>
                    <option value="4">4 - Low</option>
                    <option value="5">5 - Trivial</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTask(false)}
                  className="flex-1 px-4 py-2 bg-purple-950/50 border border-purple-500/30 rounded text-purple-300 hover:bg-purple-900/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white font-medium transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  )
}
