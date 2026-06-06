'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Terminal as TerminalIcon, Sun, Moon } from 'lucide-react'
import CommandCenter from '@/components/hud/CommandCenter'
import SystemMetrics from '@/components/hud/SystemMetrics'
import ProjectBrain from '@/components/hud/ProjectBrain'
import AIProviderSelector from '@/components/hud/AIProviderSelector'
import Terminal from '@/components/interface/Terminal'
import AIChat from '@/components/interface/AIChat'
import PreviewPanel from '@/components/interface/PreviewPanel'
import Logo from '@/components/core/Logo'
import { PreviewContent } from '@/lib/previewStore'

export default function VariAI() {
  const [activeView, setActiveView] = useState<'workspace' | 'terminal'>('workspace')
  const [time, setTime] = useState('')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [preview, setPreview] = useState<PreviewContent | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('vari-theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('vari-theme', theme)
  }, [theme])

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Listen for preview events from AIChat
  useEffect(() => {
    const onOpen = (e: Event) => setPreview((e as CustomEvent<PreviewContent>).detail)
    const onClose = () => setPreview(null)
    window.addEventListener('vari-preview-open', onOpen)
    window.addEventListener('vari-preview-close', onClose)
    return () => {
      window.removeEventListener('vari-preview-open', onOpen)
      window.removeEventListener('vari-preview-close', onClose)
    }
  }, [])

  return (
    <main className="w-full h-screen overflow-hidden flex flex-col" style={{ background: 'var(--vari-darker)' }}>
      {/* ProjectBrain floating button/panel */}
      <ProjectBrain />
      
      {theme === 'dark' && (
        <div className="fixed inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(99,102,241,0.1) 0%, transparent 60%)',
        }} />
      )}

      {/* Header */}
      <header className="relative shrink-0 flex items-center justify-between px-6 h-14 border-b"
        style={{ background: theme === 'dark' ? 'rgba(13,13,20,0.95)' : 'rgba(255,255,255,0.9)', borderColor: 'var(--vari-border)', backdropFilter: 'blur(12px)' }}>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <Logo className="w-7 h-7" />
            <span className="font-bold text-sm tracking-wide" style={{ color: 'var(--vari-light)' }}>V-AI</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium"
              style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--vari-primary)', border: '1px solid rgba(99,102,241,0.2)' }}>
              OS
            </span>
          </div>
          <div className="w-px h-4" style={{ background: 'var(--vari-border)' }} />
          <nav className="flex items-center gap-1">
            {[
              { id: 'workspace', label: 'Workspace', icon: LayoutDashboard },
              { id: 'terminal', label: 'Terminal', icon: TerminalIcon },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveView(id as any)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  background: activeView === id ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: activeView === id ? 'var(--vari-primary)' : 'var(--vari-muted)',
                  border: `1px solid ${activeView === id ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                }}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <AIProviderSelector />
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
            <span className="text-[11px]" style={{ color: 'var(--vari-muted)' }}>Online</span>
          </div>
          <span className="text-xs font-mono" style={{ color: 'var(--vari-muted)' }}>{time}</span>
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--vari-primary)', border: '1px solid rgba(99,102,241,0.2)' }}>
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeView === 'workspace' ? (
            <motion.div key="workspace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="h-full flex gap-3 p-3">

              {/* Left sidebar */}
              <div className="w-64 shrink-0 h-full overflow-y-auto">
                <CommandCenter />
              </div>

              {/* Center: Chat + optional Preview */}
              <div className="flex-1 min-w-0 h-full flex gap-3">
                <div className={`h-full min-w-0 transition-all duration-300 ${preview ? 'w-[45%] shrink-0' : 'flex-1'}`}>
                  <AIChat />
                </div>

                <AnimatePresence>
                  {preview && (
                    <motion.div key="preview" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.25 }}
                      className="flex-1 min-w-0 h-full overflow-hidden">
                      <PreviewPanel content={preview} onClose={() => setPreview(null)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right sidebar */}
              <div className="w-60 shrink-0 h-full overflow-y-auto">
                <SystemMetrics />
              </div>
            </motion.div>
          ) : (
            <motion.div key="terminal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="h-full p-3">
              <Terminal onClose={() => setActiveView('workspace')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
