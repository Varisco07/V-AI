export interface SessionStats {
  prompts: number
  tokens: number       // estimated (chars / 4)
  avgResponseMs: number
  sessionStart: number
}

const KEY = 'vari-session-stats'

export function getStats(): SessionStats {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null') || {
      prompts: 0, tokens: 0, avgResponseMs: 0, sessionStart: Date.now()
    }
  } catch {
    return { prompts: 0, tokens: 0, avgResponseMs: 0, sessionStart: Date.now() }
  }
}

export function recordPrompt(inputChars: number, outputChars: number, durationMs: number) {
  const s = getStats()
  const newPrompts = s.prompts + 1
  const addedTokens = Math.floor((inputChars + outputChars) / 4)
  const newAvg = s.prompts === 0
    ? durationMs
    : Math.round((s.avgResponseMs * s.prompts + durationMs) / newPrompts)

  const updated: SessionStats = {
    prompts: newPrompts,
    tokens: s.tokens + addedTokens,
    avgResponseMs: newAvg,
    sessionStart: s.sessionStart,
  }
  localStorage.setItem(KEY, JSON.stringify(updated))
  window.dispatchEvent(new Event('vari-stats-update'))
}

export function resetStats() {
  localStorage.setItem(KEY, JSON.stringify({
    prompts: 0, tokens: 0, avgResponseMs: 0, sessionStart: Date.now()
  }))
  window.dispatchEvent(new Event('vari-stats-update'))
}

export function formatTokens(n: number): string {
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n/1000).toFixed(1)}k`
  return String(n)
}

export function sessionDuration(start: number): string {
  const m = Math.floor((Date.now() - start) / 60000)
  if (m < 60) return `${m}m`
  return `${Math.floor(m/60)}h ${m%60}m`
}
