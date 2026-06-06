'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu, MemoryStick, Server, Activity, Wifi,
  FileText, Code2, Bug, FolderArchive, MessageSquare,
  Zap, BarChart2,
} from 'lucide-react'

interface SystemData {
  cpu:    { usage: string; cores: number; model: string }
  memory: { usage: string; total: string; used: string; free: string }
  system: { platform: string; arch: string; hostname: string; uptime: string }
}

// ── Circle metric ─────────────────────────────────────────────────────────────

function CircleMetric({ value, color, label, sub }: {
  value: number; color: string; label: string; sub: string
}) {
  const r    = 24
  const circ = 2 * Math.PI * r
  const filled = (value / 100) * circ

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-14 h-14">
        <svg width="56" height="56" viewBox="0 0 56 56" className="absolute inset-0">
          <circle cx="28" cy="28" r={r} fill="none"
            stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
          <motion.circle
            cx="28" cy="28" r={r}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${circ}`}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - filled }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="metric-ring"
            style={{ filter: `drop-shadow(0 0 3px ${color}88)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold" style={{ color }}>{value}%</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-[11px] font-semibold" style={{ color: 'var(--vari-light)' }}>{label}</div>
        <div className="text-[9px] font-mono mt-0.5" style={{ color: 'var(--vari-muted)' }}>{sub}</div>
      </div>
    </div>
  )
}

// ── Mini bar ──────────────────────────────────────────────────────────────────

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-1 rounded-full overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.05)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.6 }}
      />
    </div>
  )
}

// ── Activity ──────────────────────────────────────────────────────────────────

export interface ActivityItem {
  id: string
  type: 'pdf' | 'code' | 'zip' | 'chat' | 'bug' | 'file'
  label: string
  detail?: string
  ts: number
}

const ACTIVITY_KEY = 'vari-ai-activity'

export function pushActivity(item: Omit<ActivityItem, 'id' | 'ts'>) {
  try {
    const existing: ActivityItem[] = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]')
    const next = [{ ...item, id: Date.now().toString(), ts: Date.now() }, ...existing].slice(0, 20)
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event('vari-activity'))
  } catch {}
}

const activityIcon: Record<ActivityItem['type'], React.FC<any>> = {
  pdf: FileText, code: Code2, zip: FolderArchive,
  chat: MessageSquare, bug: Bug, file: Zap,
}
const activityColor: Record<ActivityItem['type'], string> = {
  pdf: '#06B6D4', code: '#6366F1', zip: '#F59E0B',
  chat: '#10B981', bug: '#EF4444', file: '#8B5CF6',
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60)  return `${s}s fa`
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}m fa`
  return `${Math.floor(m / 60)}h fa`
}

// ── Row helper ────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--vari-border)' }}>
      <span className="text-[10px] shrink-0" style={{ color: 'var(--vari-muted)' }}>{label}</span>
      <span className="text-[10px] font-mono truncate text-right" style={{ color: 'var(--vari-light)' }}>
        {value}
      </span>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label, color, action }: {
  icon: React.FC<any>; label: string; color: string; action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-2.5">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--vari-muted)' }}>
          {label}
        </span>
      </div>
      {action}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SystemMetrics() {
  const [metrics,   setMetrics]   = useState<SystemData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [pulse,     setPulse]     = useState(false)
  const [activity,  setActivity]  = useState<ActivityItem[]>([])
  const [stats,     setStats]     = useState<{
    prompts: number; tokens: number; avgResponseMs: number; sessionStart: number
  } | null>(null)

  useEffect(() => {
    const reload      = () => { try { setActivity(JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]')) } catch {} }
    const reloadStats = () => { try { setStats(JSON.parse(localStorage.getItem('vari-session-stats') || 'null')) } catch {} }
    reload(); reloadStats()
    window.addEventListener('vari-activity',     reload)
    window.addEventListener('vari-stats-update', reloadStats)
    return () => {
      window.removeEventListener('vari-activity',     reload)
      window.removeEventListener('vari-stats-update', reloadStats)
    }
  }, [])

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch('/api/system/metrics')
        if (!res.ok) throw new Error('Failed')
        setMetrics(await res.json())
        setError(null)
        setPulse(p => !p)
      } catch {
        setError('Metriche non disponibili')
      } finally {
        setIsLoading(false)
      }
    }
    fetch_()
    const id = setInterval(fetch_, 5000)
    return () => clearInterval(id)
  }, [])

  const cpuVal = metrics ? parseFloat(metrics.cpu.usage) : 0
  const memVal = metrics ? parseFloat(metrics.memory.usage) : 0

  return (
    <div className="p-3 space-y-2.5">

      {/* ── CPU + RAM circles ───────────────────────────────────────────── */}
      <div className="rounded-xl p-3" style={{ background: 'var(--vari-card)', border: '1px solid var(--vari-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3" style={{ color: 'var(--vari-accent)' }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--vari-muted)' }}>
              System
            </span>
          </div>
          <div className="flex items-center gap-1">
            <motion.div
              animate={{ opacity: pulse ? 1 : 0.25 }}
              transition={{ duration: 0.4 }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--vari-success)' }}
            />
            <span className="text-[9px] font-mono" style={{ color: 'var(--vari-muted)' }}>LIVE</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-16">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Activity className="w-4 h-4" style={{ color: 'var(--vari-primary)' }} />
            </motion.div>
          </div>
        ) : error ? (
          <p className="text-[10px] text-center py-3" style={{ color: 'var(--vari-muted)' }}>{error}</p>
        ) : metrics ? (
          <div className="flex justify-around">
            <CircleMetric value={cpuVal} color="#6366F1" label="CPU" sub={`${metrics.cpu.cores} core`} />
            <CircleMetric value={memVal} color="#06B6D4" label="RAM" sub={`${metrics.memory.used}/${metrics.memory.total}G`} />
          </div>
        ) : null}
      </div>

      {/* ── CPU detail ──────────────────────────────────────────────────── */}
      {metrics && (
        <div className="rounded-xl p-3 space-y-2"
          style={{ background: 'var(--vari-card)', border: '1px solid var(--vari-border)' }}>
          <SectionHeader icon={Cpu} label="CPU Load" color="var(--vari-primary)"
            action={<span className="text-[10px] font-mono font-semibold" style={{ color: 'var(--vari-primary)' }}>{metrics.cpu.usage}</span>} />
          <MiniBar value={cpuVal} color="var(--vari-primary)" />
          <p className="text-[9px] font-mono truncate" style={{ color: 'var(--vari-muted)' }}>
            {metrics.cpu.model.split(' ').slice(0, 5).join(' ')}
          </p>
        </div>
      )}

      {/* ── Memory detail ───────────────────────────────────────────────── */}
      {metrics && (
        <div className="rounded-xl p-3 space-y-2"
          style={{ background: 'var(--vari-card)', border: '1px solid var(--vari-border)' }}>
          <SectionHeader icon={MemoryStick} label="Memory" color="var(--vari-accent)"
            action={<span className="text-[10px] font-mono font-semibold" style={{ color: 'var(--vari-accent)' }}>{metrics.memory.usage}</span>} />
          <MiniBar value={memVal} color="var(--vari-accent)" />
          <div className="flex justify-between text-[9px] font-mono" style={{ color: 'var(--vari-muted)' }}>
            <span>Used {metrics.memory.used} GB</span>
            <span>Free {metrics.memory.free} GB</span>
          </div>
        </div>
      )}

      {/* ── System info ─────────────────────────────────────────────────── */}
      {metrics && (
        <div className="rounded-xl p-3"
          style={{ background: 'var(--vari-card)', border: '1px solid var(--vari-border)' }}>
          <SectionHeader icon={Server} label="System Info" color="var(--vari-secondary)" />
          <div className="space-y-1">
            <InfoRow label="Host"   value={metrics.system.hostname} />
            <InfoRow label="OS"     value={`${metrics.system.platform} ${metrics.system.arch}`} />
            <InfoRow label="Uptime" value={metrics.system.uptime} />
          </div>
        </div>
      )}

      {/* ── Status ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl p-3 flex items-center justify-between"
        style={{ background: 'var(--vari-card)', border: '1px solid rgba(16,185,129,0.18)' }}>
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3 h-3" style={{ color: 'var(--vari-success)' }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--vari-muted)' }}>
            Status
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--vari-success)', boxShadow: '0 0 5px rgba(16,185,129,0.7)' }} />
          <span className="text-[10px] font-semibold" style={{ color: 'var(--vari-success)' }}>Operational</span>
        </div>
      </div>

      {/* ── Session stats ───────────────────────────────────────────────── */}
      <div className="rounded-xl p-3"
        style={{ background: 'var(--vari-card)', border: '1px solid var(--vari-border)' }}>
        <SectionHeader
          icon={BarChart2} label="Sessione AI" color="var(--vari-secondary)"
          action={stats && stats.prompts > 0 ? (
            <button
              onClick={() => {
                localStorage.setItem('vari-session-stats', JSON.stringify({
                  prompts: 0, tokens: 0, avgResponseMs: 0, sessionStart: Date.now()
                }))
                window.dispatchEvent(new Event('vari-stats-update'))
              }}
              className="text-[9px] hover:opacity-60 transition-opacity"
              style={{ color: 'var(--vari-muted)' }}>
              Reset
            </button>
          ) : undefined}
        />

        {!stats || stats.prompts === 0 ? (
          <p className="text-[10px] text-center py-2" style={{ color: 'var(--vari-muted)' }}>
            Nessuna richiesta ancora.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: 'Prompt',  value: String(stats.prompts) },
              { label: 'Token',   value: stats.tokens >= 1000 ? `${(stats.tokens / 1000).toFixed(1)}k` : String(stats.tokens) },
              { label: 'Avg',     value: stats.avgResponseMs > 1000 ? `${(stats.avgResponseMs / 1000).toFixed(1)}s` : `${stats.avgResponseMs}ms` },
              { label: 'Durata',  value: (() => { const m = Math.floor((Date.now() - stats.sessionStart) / 60000); return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m` })() },
            ].map(({ label, value }) => (
              <div key={label} className="px-2 py-1.5 rounded-lg text-center"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--vari-border)' }}>
                <div className="text-[11px] font-bold font-mono" style={{ color: 'var(--vari-secondary)' }}>{value}</div>
                <div className="text-[9px] mt-0.5" style={{ color: 'var(--vari-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Activity feed ───────────────────────────────────────────────── */}
      <div className="rounded-xl p-3"
        style={{ background: 'var(--vari-card)', border: '1px solid var(--vari-border)' }}>
        <SectionHeader
          icon={Zap} label="Activity" color="var(--vari-warning)"
          action={activity.length > 0 ? (
            <button
              onClick={() => { localStorage.removeItem(ACTIVITY_KEY); setActivity([]) }}
              className="text-[9px] hover:opacity-60 transition-opacity"
              style={{ color: 'var(--vari-muted)' }}>
              Clear
            </button>
          ) : undefined}
        />

        {activity.length === 0 ? (
          <p className="text-[10px] text-center py-3" style={{ color: 'var(--vari-muted)' }}>
            Nessuna attività ancora.
          </p>
        ) : (
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {activity.slice(0, 8).map(item => {
                const Icon  = activityIcon[item.type]
                const color = activityColor[item.type]
                return (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 px-2 py-1.5 rounded-lg"
                    style={{ background: `${color}0D`, border: `1px solid ${color}20` }}>
                    <div className="w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${color}20` }}>
                      <Icon className="w-2 h-2" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-medium leading-tight truncate"
                        style={{ color: 'var(--vari-light)' }}>
                        {item.label}
                      </div>
                      {item.detail && (
                        <div className="text-[9px] truncate mt-0.5" style={{ color: 'var(--vari-muted)' }}>
                          {item.detail}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] shrink-0 mt-0.5 font-mono" style={{ color: 'var(--vari-muted)' }}>
                      {timeAgo(item.ts)}
                    </span>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

    </div>
  )
}