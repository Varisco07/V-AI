'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Check, ChevronDown } from 'lucide-react'

export type AIProvider = 'ollama' | 'openrouter'

interface Model {
  id: string
  name: string
  provider: AIProvider
}

const MODELS: Model[] = [
  // Ollama models
  { id: 'llama3.1:8b', name: 'Llama 3.1 8B (Local)', provider: 'ollama' },
  { id: 'llama3.2:3b', name: 'Llama 3.2 3B (Local)', provider: 'ollama' },
  { id: 'codellama:7b', name: 'Code Llama 7B (Local)', provider: 'ollama' },
  { id: 'mistral:7b', name: 'Mistral 7B (Local)', provider: 'ollama' },
  
  // OpenRouter models
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo (OpenRouter)', provider: 'openrouter' },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo (OpenRouter)', provider: 'openrouter' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus (OpenRouter)', provider: 'openrouter' },
  { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet (OpenRouter)', provider: 'openrouter' },
  { id: 'google/gemini-pro', name: 'Gemini Pro (OpenRouter)', provider: 'openrouter' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B (OpenRouter)', provider: 'openrouter' },
]

interface Props {
  onProviderChange?: (provider: AIProvider, model: string) => void
}

export default function AIProviderSelector({ onProviderChange }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [provider, setProvider] = useState<AIProvider>('ollama')
  const [model, setModel] = useState('llama3.1:8b')

  useEffect(() => {
    // Load from localStorage
    const savedProvider = localStorage.getItem('ai-provider') as AIProvider
    const savedModel = localStorage.getItem('ai-model')
    
    if (savedProvider) setProvider(savedProvider)
    if (savedModel) setModel(savedModel)
  }, [])

  const handleChange = (newProvider: AIProvider, newModel: string) => {
    setProvider(newProvider)
    setModel(newModel)
    
    localStorage.setItem('ai-provider', newProvider)
    localStorage.setItem('ai-model', newModel)
    
    // Emit custom event for AIChat to listen to
    window.dispatchEvent(new CustomEvent('ai-provider-changed', {
      detail: { provider: newProvider, model: newModel }
    }))
    
    onProviderChange?.(newProvider, newModel)
    setIsOpen(false)
  }

  const currentModel = MODELS.find(m => m.id === model) || MODELS[0]
  const providerModels = MODELS.filter(m => m.provider === provider)

  return (
    <div className="relative">
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all font-medium"
        style={{
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.25)',
          color: 'var(--vari-light)',
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Settings className="w-4 h-4" style={{ color: 'var(--vari-primary)' }} />
        <span>{currentModel.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--vari-muted)' }} />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 right-0 w-80 z-50 rounded-xl backdrop-blur-2xl shadow-2xl overflow-hidden"
              style={{
                background: 'var(--vari-card)',
                border: '1px solid var(--vari-border-bright)',
                boxShadow: '0 0 0 1px rgba(99,102,241,0.1), 0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              {/* Header */}
              <div className="p-4 border-b" style={{ borderColor: 'var(--vari-border)', background: 'rgba(255,255,255,0.03)' }}>
                <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--vari-light)' }}>AI Provider</h3>
                <p className="text-xs" style={{ color: 'var(--vari-muted)' }}>Choose your AI model</p>
              </div>

              {/* Provider Tabs */}
              <div className="flex gap-2 p-3 border-b" style={{ borderColor: 'var(--vari-border)', background: 'rgba(255,255,255,0.03)' }}>
                {(['ollama', 'openrouter'] as AIProvider[]).map(p => (
                  <button
                    key={p}
                    onClick={() => {
                      const firstModel = MODELS.find(m => m.provider === p)
                      if (firstModel) handleChange(p, firstModel.id)
                    }}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                    style={
                      provider === p
                        ? {
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(236,72,153,0.2))',
                            color: 'var(--vari-light)',
                            border: '1px solid rgba(99,102,241,0.3)',
                          }
                        : {
                            background: 'rgba(255,255,255,0.04)',
                            color: 'var(--vari-muted)',
                            border: '1px solid transparent',
                          }
                    }
                  >
                    {p === 'ollama' ? '🏠 Local (Ollama)' : '☁️ Cloud (OpenRouter)'}
                  </button>
                ))}
              </div>

              {/* Models List */}
              <div className="max-h-80 overflow-y-auto p-2">
                {providerModels.map(m => (
                  <motion.button
                    key={m.id}
                    onClick={() => handleChange(m.provider, m.id)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
                    style={
                      model === m.id
                        ? {
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(236,72,153,0.1))',
                            border: '1px solid rgba(99,102,241,0.25)',
                          }
                        : {
                            background: 'transparent',
                            border: '1px solid transparent',
                          }
                    }
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: 'var(--vari-light)' }}>{m.name}</div>
                      <div className="text-xs capitalize" style={{ color: 'var(--vari-muted)' }}>{m.provider}</div>
                    </div>
                    {model === m.id && (
                      <Check className="w-4 h-4" style={{ color: 'var(--vari-success)' }} />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Info */}
              <div className="p-3 border-t" style={{ borderColor: 'var(--vari-border)', background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-xs" style={{ color: 'var(--vari-muted)' }}>
                  {provider === 'ollama' 
                    ? '🏠 Free, runs locally on your machine'
                    : '☁️ Requires OpenRouter API key. Get one at openrouter.ai/keys'
                  }
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
  const [model, setModel] = useState('llama3.1:8b')

  useEffect(() => {
    const savedProvider = localStorage.getItem('ai-provider') as AIProvider
    const savedModel = localStorage.getItem('ai-model')
    
    if (savedProvider) setProvider(savedProvider)
    if (savedModel) setModel(savedModel)
  }, [])

  return { provider, model }
}
