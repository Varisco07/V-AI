'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, MemoryStick, Server, Activity, Wifi, FileText, Code2, Bug, FolderArchive, MessageSquare, Zap, BarChart2, RotateCcw } from 'lucide-react'

interface SystemData {
  cpu: { usage: string; cores: number; model: string }
  memory: { usage: string; total: string; used: string; free: string }
  system: { platform: string; arch: string; hostname: string; uptime: string }
}

function CircleMetric({ value, color, label, sub }: { value: number; color: string; label: string; sub: string }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const filled = (value / 100) * circ

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-16">
        <svg width="64" height="64" viewBox="0 0 64 64" className="absolute inset-0">
          <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
          <motion.circle
            cx="32" cy="32" r={r}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${circ}`}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - filled }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="metric-ring"
            style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>{value}%</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs font-semibold" style={{ color: 'var(--vari-light)' }}>{label}</div>
        <div className="text-[10px] mt-0.5 font-mono" style={{ color: 'var(--vari-muted)' }}>{sub}</div>
      </div>
    </div>
  )
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
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

// ── Activity types ───────────────────────────────────────────────────────────

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
  pdf: FileText, code: Code2, zip: FolderArchive, chat: MessageSquare, bug: Bug, file: Zap,
}
const activityColor: Record<ActivityItem['type'], string> = {
  pdf: '#06B6D4', code: '#6366F1', zip: '#F59E0B', chat: '#10B981', bug: '#EF4444', file: '#8B5CF6',
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function SystemMetrics() {
  const [metrics, setMetrics] = useState<SystemData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pulse, setPulse] = useState(false)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [stats, setStats] = useState<{ prompts:number; tokens:number; avgResponseMs:number; sessionStart:number } | null>(null)

  // Load activity from localStorage
  useEffect(() => {
    const reload = () => {
      try { setActivity(JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]')) } catch {}
    }
    const reloadStats = () => {
      try {
        const s = JSON.parse(localStorage.getItem('vari-session-stats') || 'null')
        setStats(s)
      } catch {}
    }
    reload(); reloadStats()
    window.addEventListener('vari-activity', reload)
    window.addEventListener('vari-stats-update', reloadStats)
    return () => {
      window.removeEventListener('vari-activity', reload)
      window.removeEventListener('vari-stats-update', reloadStats)
    }
  }, [])

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/system/metrics')
        if (!response.ok) throw new Error('Failed')
        const data = await response.json()
        setMetrics(data)
        setError(null)
        setPulse(p => !p)
      } catch (err) {
        setError('Unable to fetch metrics')
      } finally {
        setIsLoading(false)
      }
    }
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [])

  const cpuVal = metrics ? parseFloat(metrics.cpu.usage) : 0
  const memVal = metrics ? parseFloat(metrics.memory.usage) : 0

  return (
    <div className="space-y-3 h-full">
      {/* Metrics Header */}
      <div className="card-glow p-4" style={{ background: 'var(--vari-card)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: 'var(--vari-accent)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--vari-light)' }}>System</span>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{ opacity: pulse ? 1 : 0.3 }}
              transition={{ duration: 0.3 }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--vari-success)' }}
            />
            <span className="text-[10px] font-mono" style={{ color: 'var(--vari-muted)' }}>LIVE</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Activity className="w-5 h-5" style={{ color: 'var(--vari-primary)' }} />
            </motion.div>
          </div>
        ) : error ? (
          <p className="text-xs text-center py-4" style={{ color: 'var(--vari-error)' }}>{error}</p>
        ) : metrics ? (
          <div className="flex justify-around">
            <CircleMetric
              value={cpuVal}
              color="#6366F1"
              label="CPU"
              sub={`${metrics.cpu.cores}c`}
            />
            <CircleMetric
              value={memVal}
              color="#06B6D4"
              label="RAM"
              sub={`${metrics.memory.used}/${metrics.memory.total}G`}
            />
          </div>
        ) : null}
      </div>

      {/* CPU detail */}
      {metrics && (
        <div className="card p-3 space-y-2.5" style={{ background: 'var(--vari-card)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" style={{ color: 'var(--vari-primary)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--vari-muted)' }}>CPU Load</span>
            </div>
            <span className="text-xs font-mono font-semibold" style={{ color: 'var(--vari-primary)' }}>{metrics.cpu.usage}</span>
          </div>
          <MiniBar value={cpuVal} color="var(--vari-primary)" />
          <p className="text-[10px] font-mono truncate" style={{ color: 'var(--vari-muted)' }}>
            {metrics.cpu.model.split(' ').slice(0, 4).join(' ')}
          </p>
        </div>
      )}

      {/* Memory detail */}
      {metrics && (
        <div className="card p-3 space-y-2.5" style={{ background: 'var(--vari-card)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MemoryStick className="w-3.5 h-3.5" style={{ color: 'var(--vari-accent)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--vari-muted)' }}>Memory</span>
            </div>
            <span className="text-xs font-mono font-semibold" style={{ color: 'var(--vari-accent)' }}>{metrics.memory.usage}</span>
          </div>
          <MiniBar value={memVal} color="var(--vari-accent)" />
          <div className="flex justify-between text-[10px] font-mono" style={{ color: 'var(--vari-muted)' }}>
            <span>Used {metrics.memory.used}GB</span>
            <span>Free {metrics.memory.free}GB</span>
          </div>
        </div>
      )}

      {/* System Info */}
      {metrics && (
        <div className="card p-3" style={{ background: 'var(--vari-card)' }}>
          <div className="flex items-center gap-1.5 mb-3">
            <Server className="w-3.5 h-3.5" style={{ color: 'var(--vari-secondary)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--vari-light)' }}>System Info</span>
          </div>
          <div className="space-y-1.5">
            {[
              { label: 'Host', value: metrics.system.hostname },
              { label: 'OS', value: `${metrics.system.platform} ${metrics.system.arch}` },
              { label: 'Uptime', value: metrics.system.uptime },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-2.5 py-1.5 rounded-md"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--vari-border)' }}>
                <span className="text-[11px]" style={{ color: 'var(--vari-muted)' }}>{label}</span>
                <span className="text-[11px] font-mono truncate ml-2 max-w-[120px]" style={{ color: 'var(--vari-light)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="card p-3 flex items-center justify-between"
        style={{ background: 'var(--vari-card)', borderColor: 'rgba(16,185,129,0.2)' }}>
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5" style={{ color: 'var(--vari-success)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--vari-light)' }}>Status</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--vari-success)', boxShadow: '0 0 6px rgba(16,185,129,0.6)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--vari-success)' }}>Operational</span>
        </div>
      </div>

      {/* Session stats */}
      <div className="card p-3" style={{ background: 'var(--vari-card)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" style={{ color: 'var(--vari-secondary)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--vari-light)' }}>Sessione AI</span>
          </div>
          {stats && stats.prompts > 0 && (
            <button onClick={() => {
              localStorage.setItem('vari-session-stats', JSON.stringify({ prompts:0, tokens:0, avgResponseMs:0, sessionStart: Date.now() }))
              window.dispatchEvent(new Event('vari-stats-update'))
            }} className="text-[10px] hover:opacity-60 transition-opacity" style={{ color: 'var(--vari-muted)' }}>
              Reset
            </button>
          )}
        </div>
        {!stats || stats.prompts === 0 ? (
          <p className="text-[11px] text-center py-2" style={{ color: 'var(--vari-muted)' }}>
            Nessuna richiesta ancora.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Prompt', value: String(stats.prompts) },
              { label: 'Token ~', value: stats.tokens >= 1000 ? `${(stats.tokens/1000).toFixed(1)}k` : String(stats.tokens) },
              { label: 'Tempo medio', value: stats.avgResponseMs > 1000 ? `${(stats.avgResponseMs/1000).toFixed(1)}s` : `${stats.avgResponseMs}ms` },
              { label: 'Durata', value: (() => { const m = Math.floor((Date.now() - stats.sessionStart) / 60000); return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m` })() },
            ].map(({ label, value }) => (
              <div key={label} className="px-2.5 py-2 rounded-lg text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--vari-border)' }}>
                <div className="text-xs font-bold font-mono" style={{ color: 'var(--vari-secondary)' }}>{value}</div>
                <div className="text-[9px] mt-0.5" style={{ color: 'var(--vari-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity feed */}
      <div className="card p-3" style={{ background: 'var(--vari-card)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" style={{ color: 'var(--vari-warning)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--vari-light)' }}>Activity</span>
          </div>
          {activity.length > 0 && (
            <button onClick={() => { localStorage.removeItem(ACTIVITY_KEY); setActivity([]) }}
              className="text-[10px] transition-opacity hover:opacity-60"
              style={{ color: 'var(--vari-muted)' }}>Clear</button>
          )}
        </div>

        {activity.length === 0 ? (
          <p className="text-[11px] text-center py-4" style={{ color: 'var(--vari-muted)' }}>
            No activity yet. Start a conversation.
          </p>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {activity.slice(0, 8).map(item => {
                const Icon = activityIcon[item.type]
                const color = activityColor[item.type]
                return (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 px-2.5 py-2 rounded-lg"
                    style={{ background: `${color}0D`, border: `1px solid ${color}22` }}>
                    <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${color}20` }}>
                      <Icon className="w-2.5 h-2.5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium leading-tight" style={{ color: 'var(--vari-light)' }}>{item.label}</div>
                      {item.detail && (
                        <div className="text-[10px] truncate mt-0.5" style={{ color: 'var(--vari-muted)' }}>{item.detail}</div>
                      )}
                    </div>
                    <span className="text-[9px] shrink-0 mt-0.5 font-mono" style={{ color: 'var(--vari-muted)' }}>{timeAgo(item.ts)}</span>
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