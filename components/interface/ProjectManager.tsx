'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderPlus,
  Folder,
  FileCode,
  GitBranch,
  Play,
  Trash2,
  Settings,
  Search,
  Filter,
  MoreVertical,
} from 'lucide-react'

interface Project {
  id: string
  name: string
  type: string
  status: 'active' | 'idle' | 'completed'
  files: number
  lastModified: Date
  progress: number
  color: string
}

export default function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'JARVIS Core System',
      type: 'Next.js',
      status: 'active',
      files: 47,
      lastModified: new Date(),
      progress: 75,
      color: '#00D9FF',
    },
    {
      id: '2',
      name: 'Neural Network API',
      type: 'Python',
      status: 'active',
      files: 23,
      lastModified: new Date(Date.now() - 86400000),
      progress: 60,
      color: '#0A84FF',
    },
    {
      id: '3',
      name: 'Mobile Interface',
      type: 'React Native',
      status: 'idle',
      files: 31,
      lastModified: new Date(Date.now() - 172800000),
      progress: 45,
      color: '#FF6B35',
    },
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="glass-strong rounded-lg border border-stark-cyan/30 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="bg-stark-navy/70 border-b border-stark-cyan/30 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Folder className="w-5 h-5 text-stark-cyan" />
            <h2 className="text-lg font-bold neon-text-blue">PROJECT MANAGER</h2>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gradient-to-r from-stark-cyan to-stark-blue rounded-lg flex items-center space-x-2 text-white font-bold shadow-neon-cyan"
          >
            <FolderPlus className="w-4 h-4" />
            <span>NEW PROJECT</span>
          </motion.button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stark-cyan/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-10 py-2 bg-stark-navy/50 border border-stark-cyan/30 rounded-lg text-stark-cyan placeholder-stark-cyan/50 outline-none focus:border-stark-cyan transition-colors"
          />
          <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stark-cyan/50 cursor-pointer hover:text-stark-cyan" />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isSelected={selectedProject === project.id}
                onSelect={() => setSelectedProject(project.id)}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-stark-cyan/50">
            <Folder className="w-16 h-16 mb-4" />
            <p>No projects found</p>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="bg-stark-navy/70 border-t border-stark-cyan/30 p-4 grid grid-cols-4 gap-4 text-center">
        <StatCard label="Total" value={projects.length} />
        <StatCard
          label="Active"
          value={projects.filter((p) => p.status === 'active').length}
        />
        <StatCard
          label="Completed"
          value={projects.filter((p) => p.status === 'completed').length}
        />
        <StatCard
          label="Files"
          value={projects.reduce((acc, p) => acc + p.files, 0)}
        />
      </div>
    </div>
  )
}

function ProjectCard({ project, isSelected, onSelect }: any) {
  const [showMenu, setShowMenu] = useState(false)

  const statusColors: Record<'active' | 'idle' | 'completed', string> = {
    active: 'bg-green-500',
    idle: 'bg-yellow-500',
    completed: 'bg-blue-500',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      onClick={onSelect}
      className={`glass rounded-lg p-4 border cursor-pointer relative ${
        isSelected ? 'border-stark-cyan shadow-neon-cyan' : 'border-stark-cyan/20'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${statusColors[project.status as 'active' | 'idle' | 'completed']} shadow-lg animate-pulse`}
          />
          <h3 className="font-bold text-stark-cyan">{project.name}</h3>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className="text-stark-cyan/50 hover:text-stark-cyan"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Type Badge */}
      <div className="inline-block px-2 py-1 rounded text-xs bg-stark-navy/50 text-stark-cyan/70 mb-3">
        {project.type}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-stark-cyan/70">
        <div className="flex items-center space-x-1">
          <FileCode className="w-3 h-3" />
          <span>{project.files} files</span>
        </div>
        <div className="flex items-center space-x-1">
          <GitBranch className="w-3 h-3" />
          <span>main</span>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-stark-cyan/70">
          <span>Progress</span>
          <span>{project.progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-stark-navy/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: project.color }}
            initial={{ width: 0 }}
            animate={{ width: `${project.progress}%` }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        </div>
      </div>

      {/* Last Modified */}
      <div className="mt-3 text-xs text-stark-cyan/50">
        Modified {formatDate(project.lastModified)}
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute right-4 top-12 glass-strong rounded-lg border border-stark-cyan/30 p-2 z-10 min-w-[150px]"
          >
            <MenuItem icon={Play} label="Run Project" />
            <MenuItem icon={Settings} label="Settings" />
            <MenuItem icon={GitBranch} label="Branches" />
            <MenuItem icon={Trash2} label="Delete" danger />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function MenuItem({ icon: Icon, label, danger = false }: any) {
  return (
    <motion.button
      whileHover={{ x: 4 }}
      className={`w-full flex items-center space-x-2 px-3 py-2 rounded text-sm ${
        danger
          ? 'text-red-500 hover:bg-red-500/20'
          : 'text-stark-cyan/70 hover:bg-stark-cyan/20 hover:text-stark-cyan'
      } transition-colors`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </motion.button>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-bold neon-text-blue">{value}</div>
      <div className="text-xs text-stark-cyan/50">{label}</div>
    </div>
  )
}

function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / 3600000)

  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}