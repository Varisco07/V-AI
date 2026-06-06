'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Terminal as TerminalIcon, Sun, Moon, Wifi } from 'lucide-react'
import CommandCenter from '@/components/hud/CommandCenter'
import SystemMetrics from '@/components/hud/SystemMetrics'
import ProjectBrain from '@/components/hud/ProjectBrain'
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
    const tick = () => setTime(new Date().toLocaleTimeString('it-IT', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onOpen  = (e: Event) => setPreview((e as CustomEvent<PreviewContent>).detail)
    const onClose = () => setPreview(null)
    window.addEventListener('vari-preview-open', onOpen)
    window.addEventListener('vari-preview-close', onClose)
    return () => {
      window.removeEventListener('vari-preview-open', onOpen)
      window.removeEventListener('vari-preview-close', onClose)
    }
  }, [])

  return (
    <main className="noise w-full h-screen overflow-hidden flex flex-col"
      style={{ background: 'var(--vari-darker)' }}>

      <ProjectBrain />

      {/* Ambient glow — dark only */}
      {theme === 'dark' && (
        <div className="fixed inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 35% at 50% -5%, rgba(99,102,241,0.09) 0%, transparent 65%)',
          zIndex: 0,
        }} />
      )}

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="relative z-10 shrink-0 flex items-center justify-between px-5 h-[52px]"
        style={{
          background: 'var(--vari-header-bg)',
          borderBottom: '1px solid var(--vari-border)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}>

        {/* Left — brand + nav */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <Logo className="w-6 h-6" />
            <span className="font-bold text-sm tracking-wide" style={{ color: 'var(--vari-light)' }}>
              V-AI
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold"
              style={{
                background: 'rgba(99,102,241,0.12)',
                color: 'var(--vari-primary)',
                border: '1px solid rgba(99,102,241,0.18)',
              }}>
              OS
            </span>
          </div>

          <div className="w-px h-3.5" style={{ background: 'var(--vari-border)' }} />

          <nav className="flex items-center gap-0.5">
            {[
              { id: 'workspace', label: 'Workspace', icon: LayoutDashboard },
              { id: 'terminal',  label: 'Terminal',  icon: TerminalIcon },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveView(id as any)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: activeView === id ? 'rgba(99,102,241,0.12)' : 'transparent',
                  color: activeView === id ? 'var(--vari-primary)' : 'var(--vari-muted)',
                  border: `1px solid ${activeView === id ? 'rgba(99,102,241,0.25)' : 'transparent'}`,
                }}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right — status + controls */}
        <div className="flex items-center gap-3">

          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              style={{ boxShadow: '0 0 5px rgba(52,211,153,0.9)' }} />
            <span className="text-[11px]" style={{ color: 'var(--vari-muted)' }}>Online</span>
          </div>

          <span className="text-[11px] font-mono tabular-nums" style={{ color: 'var(--vari-muted)' }}>
            {time}
          </span>

          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-lg"
            style={{
              background: 'rgba(99,102,241,0.08)',
              color: 'var(--vari-primary)',
              border: '1px solid rgba(99,102,241,0.15)',
            }}>
            {theme === 'dark'
              ? <Sun  className="w-3.5 h-3.5" />
              : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">

          {activeView === 'workspace' ? (
            <motion.div key="workspace"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full flex gap-2.5 p-2.5">

              {/* Left sidebar */}
              <div className="w-60 shrink-0 h-full overflow-y-auto sidebar-panel">
                <CommandCenter />
              </div>

              {/* Center */}
              <div className="flex-1 min-w-0 h-full flex gap-2.5">
                <div className={`h-full min-w-0 transition-all duration-300 ${preview ? 'w-[46%] shrink-0' : 'flex-1'}`}>
                  <AIChat />
                </div>

                <AnimatePresence>
                  {preview && (
                    <motion.div key="preview"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 min-w-0 h-full overflow-hidden rounded-[14px]"
                      style={{ border: '1px solid var(--vari-border)' }}>
                      <PreviewPanel content={preview} onClose={() => setPreview(null)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right sidebar */}
              <div className="w-56 shrink-0 h-full overflow-y-auto sidebar-panel">
                <SystemMetrics />
              </div>
            </motion.div>

          ) : (
            <motion.div key="terminal"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full p-2.5">
              <Terminal onClose={() => setActiveView('workspace')} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  )
}