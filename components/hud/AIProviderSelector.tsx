'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, Cloud, Check, ChevronDown, Zap } from 'lucide-react'

export type AIProvider = 'ollama' | 'groq'

interface Model {
  id: string
  name: string
  short: string
  provider: AIProvider
}

const MODELS: Model[] = [
  // Ollama — locali
  { id: 'llama3.1:8b',          name: 'Llama 3.1 8B',        short: 'Llama 3.1',     provider: 'ollama' },
  { id: 'llama3.2:3b',          name: 'Llama 3.2 3B',        short: 'Llama 3.2',     provider: 'ollama' },
  { id: 'qwen2.5-coder:7b',     name: 'Qwen 2.5 Coder 7B',   short: 'Qwen Coder',    provider: 'ollama' },
  { id: 'deepseek-r1:7b',       name: 'DeepSeek R1 7B',      short: 'DeepSeek R1',   provider: 'ollama' },
  { id: 'mistral:7b',           name: 'Mistral 7B',           short: 'Mistral 7B',    provider: 'ollama' },
  { id: 'codellama:7b',         name: 'Code Llama 7B',        short: 'CodeLlama',     provider: 'ollama' },
  // Groq — gratis
  { id: 'llama-3.1-8b-instant',       name: 'Llama 3.1 8B Instant',  short: 'Llama 8B',      provider: 'groq' },
  { id: 'llama-3.1-70b-versatile',    name: 'Llama 3.1 70B',         short: 'Llama 70B',     provider: 'groq' },
  { id: 'mixtral-8x7b-32768',         name: 'Mixtral 8x7B',          short: 'Mixtral',       provider: 'groq' },
  { id: 'gemma2-9b-it',                     name: 'Gemma 2 9B',            short: 'Gemma 2',       provider: 'groq' },
  { id: 'llama-3.2-11b-vision-preview',     name: 'Llama Vision 11B',      short: 'Vision 11B',    provider: 'groq' },
  { id: 'llama-3.2-90b-vision-preview',     name: 'Llama Vision 90B',      short: 'Vision 90B',    provider: 'groq' },
]

const PROVIDER_LABELS: Record<AIProvider, { label: string; badge: string; free: boolean }> = {
  ollama: { label: 'Locale', badge: '🏠', free: true },
  groq:   { label: 'Groq',   badge: '⚡', free: true },
}

export default function AIProviderSelector() {
  const [isOpen, setIsOpen]     = useState(false)
  const [provider, setProvider] = useState<AIProvider>('ollama')
  const [model, setModel]       = useState('llama3.1:8b')

  useEffect(() => {
    const p = localStorage.getItem('ai-provider') as AIProvider
    const m = localStorage.getItem('ai-model')
    if (p) setProvider(p)
    if (m) setModel(m)
  }, [])

  const handleChange = (newProvider: AIProvider, newModel: string) => {
    setProvider(newProvider)
    setModel(newModel)
    localStorage.setItem('ai-provider', newProvider)
    localStorage.setItem('ai-model', newModel)
    window.dispatchEvent(new CustomEvent('ai-provider-changed', {
      detail: { provider: newProvider, model: newModel }
    }))
    setIsOpen(false)
  }

  const current  = MODELS.find(m => m.id === model) ?? MODELS[0]
  const filtered = MODELS.filter(m => m.provider === provider)
  const info     = PROVIDER_LABELS[provider]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
        style={{
          background: 'rgba(99,102,241,0.09)',
          border: '1px solid rgba(99,102,241,0.2)',
          color: 'var(--vari-light)',
          maxWidth: 180,
        }}
      >
        <span className="shrink-0">{info.badge}</span>
        <span className="truncate">{current.short}</span>
        <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--vari-muted)' }} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.14 }}
              className="absolute top-full mt-1.5 right-0 z-50 w-80 rounded-xl overflow-hidden"
              style={{
                background: 'var(--vari-card)',
                border: '1px solid var(--vari-border-bright)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(99,102,241,0.08)',
              }}
            >
              {/* Provider tabs */}
              <div className="grid grid-cols-2 gap-1 p-2.5 border-b" style={{ borderColor: 'var(--vari-border)' }}>
                {(Object.entries(PROVIDER_LABELS) as [AIProvider, typeof PROVIDER_LABELS[AIProvider]][]).map(([p, meta]) => (
                  <button key={p}
                    onClick={() => {
                      const first = MODELS.find(m => m.provider === p)
                      if (first) handleChange(p, first.id)
                    }}
                    className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[10px] font-medium"
                    style={
                      provider === p
                        ? { background: 'rgba(99,102,241,0.15)', color: 'var(--vari-primary)', border: '1px solid rgba(99,102,241,0.25)' }
                        : { background: 'transparent', color: 'var(--vari-muted)', border: '1px solid transparent' }
                    }>
                    <span className="text-base leading-none">{meta.badge}</span>
                    <span>{meta.label}</span>
                    {meta.free && <span className="text-[8px] px-1 rounded" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>FREE</span>}
                  </button>
                ))}
              </div>

              {/* Models */}
              <div className="overflow-y-auto max-h-56 p-1.5">
                {filtered.map(m => (
                  <button key={m.id}
                    onClick={() => handleChange(m.provider, m.id)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left"
                    style={
                      model === m.id
                        ? { background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }
                        : { background: 'transparent', border: '1px solid transparent' }
                    }>
                    <div>
                      <div className="text-xs font-medium" style={{ color: 'var(--vari-light)' }}>{m.name}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--vari-muted)' }}>
                        {info.free ? '✓ Gratis' : 'Cloud · API key'}
                      </div>
                    </div>
                    {model === m.id && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--vari-success)' }} />}
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="px-3 py-2 border-t" style={{ borderColor: 'var(--vari-border)', background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-[10px]" style={{ color: 'var(--vari-muted)' }}>
                  {provider === 'ollama' && '🏠 Gira sul tuo PC — nessun costo'}
                  {provider === 'groq'   && '⚡ Gratis · console.groq.com/keys'}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export function useAIProvider() {
  const [provider, setProvider] = useState<AIProvider>('ollama')
  const [model, setModel]       = useState('llama3.1:8b')

  useEffect(() => {
    const p = localStorage.getItem('ai-provider') as AIProvider
    const m = localStorage.getItem('ai-model')
    if (p) setProvider(p)
    if (m) setModel(m)
  }, [])

  return { provider, model }
}
