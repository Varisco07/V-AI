export type AIProvider = 'ollama' | 'groq'

export interface AIConfig {
  provider: AIProvider
  model: string
}

export function getAIConfig(): AIConfig {
  if (typeof window === 'undefined') {
    return { provider: 'ollama', model: 'llama3.1:8b' }
  }

  const provider = (localStorage.getItem('ai-provider') as AIProvider) || 'ollama'
  const model = localStorage.getItem('ai-model') || 'llama3.1:8b'

  return { provider, model }
}

export function getAPIEndpoint(provider: AIProvider): string {
  switch (provider) {
    case 'groq': return '/api/chat-groq'
    default:       return '/api/chat-local'
  }
}
