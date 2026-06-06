'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Mic, MicOff, X, Paperclip, FileText, Image as ImageIcon,
  File, Settings, ChevronDown, Download, FolderArchive, Archive,
  Check, ChevronRight, Globe, Cpu, Gamepad2,
} from 'lucide-react'
import Logo from '@/components/core/Logo'
import UserAvatar from '@/components/core/UserAvatar'
import { pushActivity } from '@/components/hud/SystemMetrics'
import { openPreview } from '@/lib/previewStore'
import { addFile } from '@/lib/fileStore'
import { recordPrompt } from '@/lib/sessionStats'
import {
  loadConversations, upsertConversation, createConversation,
  getActiveId, setActiveId, titleFromMessage, StoredMessage,
} from '@/lib/conversations'
import { getAIConfig, getAPIEndpoint, type AIProvider } from '@/lib/aiProvider'
import { renderMarkdown } from '@/components/interface/Markdown'

interface ZipFile { path: string; content: string; size: number; isBinary: boolean }

interface UploadedFile {
  file: File
  text: string | null   // null = binary / unreadable
  loading: boolean
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  files?: Array<{ path: string; content: string; name?: string }>
  zipInfo?: { name: string; fileCount: number }
  gameKeyword?: string
  attachments?: string[]  // display names
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AIChat() {
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [language, setLanguage] = useState('en')
  const [aiModel, setAiModel] = useState('llama3.1:8b')
  const [aiProvider, setAiProvider] = useState<AIProvider>('ollama')

  // Jarvis agent status
  type AgentPhase = 'thinking'|'planning'|'searching'|'coding'|'reading'|'fixing'|'done'
  type AgentStatus = { phase: AgentPhase; label: string; detail?: string }
  const [agentStatus, setAgentStatus] = useState<AgentStatus|null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [zipContents, setZipContents] = useState<ZipFile[] | null>(null)
  const [zipName, setZipName] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [mounted, setMounted] = useState(false)
  const [activeConvId, setActiveConvIdState] = useState<string | null>(null)
  const convIdRef = useRef<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
  ]

  const aiModelsByProvider: Record<string, { code: string; name: string; badge: string }[]> = {
    ollama: [
      { code: 'llama3.2',          name: 'Llama 3.2',          badge: '' },
      { code: 'llama3.1:8b',       name: 'Llama 3.1 8B',       badge: '' },
      { code: 'qwen2.5-coder:7b',  name: 'Qwen2.5 Coder',      badge: 'CODE' },
      { code: 'deepseek-r1:7b',    name: 'DeepSeek R1',        badge: 'THINK' },
      { code: 'mistral',           name: 'Mistral 7B',          badge: '' },
      { code: 'codellama',         name: 'CodeLlama',           badge: 'CODE' },
    ],
    groq: [
      { code: 'llama-3.1-8b-instant',          name: 'Llama 3.1 8B Instant', badge: 'FAST' },
      { code: 'llama-3.1-70b-versatile',        name: 'Llama 3.1 70B',        badge: '' },
      { code: 'mixtral-8x7b-32768',             name: 'Mixtral 8x7B',         badge: '' },
      { code: 'gemma2-9b-it',                   name: 'Gemma 2 9B',           badge: '' },
      { code: 'llama-3.2-11b-vision-preview',   name: 'Llama 3.2 Vision 11B', badge: '👁️' },
      { code: 'llama-3.2-90b-vision-preview',   name: 'Llama 3.2 Vision 90B', badge: '👁️' },
    ],
  }
  const aiModels = aiModelsByProvider[aiProvider] ?? aiModelsByProvider.ollama

  const welcomeMsg: Record<string, string> = {
    en: "Hello! I'm V-AI. Ask me anything — code, analysis, writing, or upload a ZIP/PDF.",
    it: "Ciao! Sono V-AI. Chiedimi qualsiasi cosa — codice, analisi, testi o carica un PDF/ZIP.",
    es: "¡Hola! Soy V-AI. Pregúntame lo que quieras — código, análisis, textos o sube un PDF/ZIP.",
    fr: "Bonjour! Je suis V-AI. Demandez-moi n'importe quoi — code, analyse, textes ou téléchargez un PDF/ZIP.",
    de: "Hallo! Ich bin V-AI. Frag mich alles — Code, Analysen, Texte oder lade ein PDF/ZIP hoch.",
    pt: "Olá! Sou V-AI. Pergunte-me o que quiser — código, análise, textos ou carregue um PDF/ZIP.",
    ru: "Привет! Я V-AI. Спросите меня о чём угодно — код, анализ, тексты или загрузите PDF/ZIP.",
    zh: "你好！我是V-AI。问我任何问题 — 代码、分析、写作或上传PDF/ZIP。",
    ja: "こんにちは！私はV-AIです。コード、分析、文章、またはPDF/ZIPのアップロードなど、何でも聞いてください。",
  }

  const loadConv = (id: string | null) => {
    if (!id) {
      // Create first conversation
      const conv = createConversation()
      convIdRef.current = conv.id
      setActiveConvIdState(conv.id)
      setMessages([{ id: '1', role: 'assistant', content: welcomeMsg[language] || welcomeMsg.en, timestamp: new Date() }])
      return
    }
    const all = loadConversations()
    const conv = all.find(c => c.id === id)
    convIdRef.current = id
    setActiveConvIdState(id)
    if (!conv || conv.messages.length === 0) {
      setMessages([{ id: '1', role: 'assistant', content: welcomeMsg[language] || welcomeMsg.en, timestamp: new Date() }])
    } else {
      setMessages(conv.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })))
    }
  }

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('vari-language')
    if (saved) setLanguage(saved)
    
    // Load AI provider config
    const config = getAIConfig()
    setAiProvider(config.provider)
    setAiModel(config.model)

    const activeId = getActiveId()
    if (!activeId) {
      // No conversation yet — create one
      loadConv(null)
    } else {
      loadConv(activeId)
    }

    // Listen for conversation switches from CommandCenter
    const onSwitch = () => {
      const id = getActiveId()
      loadConv(id)
    }
    window.addEventListener('vari-conv-switch', onSwitch)
    
    // Listen for AI provider changes — aggiorna solo provider/model, MAI i messaggi
    const onProviderChange = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.provider) setAiProvider(detail.provider)
      if (detail?.model) setAiModel(detail.model)
    }
    window.addEventListener('ai-provider-changed', onProviderChange)
    
    return () => {
      window.removeEventListener('vari-conv-switch', onSwitch)
      window.removeEventListener('ai-provider-changed', onProviderChange)
    }
  }, [])

  useEffect(() => { if (mounted) localStorage.setItem('vari-model', aiModel) }, [aiModel, mounted])

  // When language changes: persist + update welcome message immediately
  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('vari-language', language)
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [{ ...prev[0], content: welcomeMsg[language] || welcomeMsg.en }]
      }
      return prev
    })
  }, [language])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Auto-resize textarea
  useEffect(() => {
    const ta = inputRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }, [input])

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const readZipFile = useCallback(async (file: File): Promise<ZipFile[]> => {
    const base64 = await readFileAsBase64(file)
    const res = await fetch('/api/read-zip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: base64 }),
    })
    if (!res.ok) throw new Error('Failed to read ZIP')
    const { files } = await res.json()
    return files
  }, [])

  const readTextFile = useCallback(async (file: File): Promise<string | null> => {
    try {
      const base64 = await readFileAsBase64(file)
      // Infer MIME from extension if browser doesn't set it
      let mime = file.type
      if (!mime || mime === 'application/octet-stream') {
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (ext === 'pdf') mime = 'application/pdf'
        else if (['txt','md','py','js','ts','jsx','tsx','html','css','json','csv'].includes(ext || ''))
          mime = 'text/plain'
      }
      const res = await fetch('/api/read-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: base64, name: file.name, type: mime }),
      })
      if (!res.ok) {
        console.error('[AIChat] read-file API error', res.status)
        return null
      }
      const json = await res.json()
      if (json.error) console.warn('[AIChat] read-file error:', json.error)
      return json.text ?? null
    } catch (e) {
      console.error('[AIChat] readTextFile threw:', e)
      return null
    }
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files
    if (!selected) return

    for (const file of Array.from(selected)) {
      if (file.name.endsWith('.zip')) {
        try {
          const contents = await readZipFile(file)
          setZipContents(contents)
          setZipName(file.name)
        } catch {
          alert('Failed to read ZIP file')
        }
      } else {
        // Add placeholder while reading
        const placeholder: UploadedFile = { file, text: null, loading: true }
        setUploadedFiles(prev => [...prev, placeholder])
        // Read content in background
        readTextFile(file).then(text => {
          setUploadedFiles(prev =>
            prev.map(u => u.file === file ? { ...u, text, loading: false } : u)
          )
          // Track in file store
          const ext = file.name.split('.').pop() || ''
          addFile({ name: file.name, ext, type: 'uploaded', size: text?.length ?? file.size, content: text ?? undefined })
        })
      }
    }
    e.target.value = ''
  }

  const removeFile = (index: number) => setUploadedFiles(prev => prev.filter((_, i) => i !== index))

  const clearZip = () => { setZipContents(null); setZipName(null) }

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const r = new SR()
    r.lang = language
    r.onresult = (e: any) => setInput(prev => prev + e.results[0][0].transcript)
    r.onend = () => setIsListening(false)
    recognitionRef.current = r
    r.start()
    setIsListening(true)
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed && uploadedFiles.length === 0 && !zipContents) return

    // Build display message (what user sees in chat)
    const fileNames = uploadedFiles.map(u => u.file.name)
    let displayContent = trimmed
    if (fileNames.length > 0) displayContent = (trimmed ? trimmed + ' ' : '') + `[${fileNames.join(', ')}]`
    if (zipContents && zipName && !displayContent) displayContent = `Analyze ${zipName}`

    // Build full message for AI (includes file text contents)
    let aiMessage = trimmed
    for (const u of uploadedFiles) {
      if (u.text) {
        const preview = u.text.length > 8000 ? u.text.slice(0, 8000) + '\n...[truncated]' : u.text
        aiMessage += `\n\n--- File: ${u.file.name} ---\n${preview}\n--- End of file ---`
      } else {
        aiMessage += `\n[Attached: ${u.file.name} — binary or unreadable file]`
      }
    }
    if (zipContents && zipName && !aiMessage.trim()) {
      aiMessage = `I've uploaded ${zipName}. Please analyze it.`
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: displayContent,
      timestamp: new Date(),
      attachments: fileNames.length > 0 ? fileNames : undefined,
      ...(zipContents && zipName ? { zipInfo: { name: zipName, fileCount: zipContents.length } } : {}),
    }

    // Emit activity for uploads
    if (zipContents && zipName) {
      pushActivity({ type: 'zip', label: 'ZIP analizzato', detail: zipName })
    }
    for (const u of uploadedFiles) {
      const ext = u.file.name.split('.').pop()?.toLowerCase()
      if (ext === 'pdf') pushActivity({ type: 'pdf', label: 'PDF allegato', detail: u.file.name })
      else if (u.text) pushActivity({ type: 'file', label: 'File allegato', detail: u.file.name })
    }
    if (!zipContents && uploadedFiles.length === 0) {
      pushActivity({ type: 'chat', label: 'Messaggio inviato', detail: trimmed.slice(0, 60) })
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    const requestStart = Date.now()

    // ── Image generation detection ───────────────────────────────────────────
    const imageKeywords = /\b(genera|crea|disegna|draw|generate|create|make|paint|illustra|immagine|image|foto|picture|photo)\b/i
    const isImageRequest = imageKeywords.test(trimmed) && trimmed.length > 5
    if (isImageRequest && aiProvider === 'gemini') {
      try {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: trimmed }),
        })
        const data = await res.json()
        if (data.image) {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `![generated](${data.image})`,
            timestamp: new Date(),
          }])
          setIsTyping(false)
          return
        }
      } catch { /* fallback to text */ }
    }
    // ────────────────────────────────────────────────────────────────────────

    // Load memory from localStorage for context injection
    let memoryContext = ''
    try {
      const mem = JSON.parse(localStorage.getItem('vari-ai-memory') || 'null')
      const parts: string[] = []
      if (mem) {
        if (mem.projectName) parts.push(`Progetto: ${mem.projectName}`)
        if (mem.frameworks?.length) parts.push(`Stack: ${mem.frameworks.join(', ')}`)
        if (mem.rules?.length) parts.push(`Regole: ${mem.rules.join('; ')}`)
        if (mem.customInstructions) parts.push(`Istruzioni: ${mem.customInstructions}`)
      }
      // Aggiungi preferenze utente salvate
      const userName = localStorage.getItem('vari-user-name')
      if (userName) parts.push(`Utente: ${userName}`)
      const userPrefs = localStorage.getItem('vari-user-prefs')
      if (userPrefs) parts.push(`Preferenze: ${userPrefs}`)
      // Lingua preferita
      parts.push(`Rispondi sempre in ${language === 'it' ? 'italiano' : language === 'es' ? 'spagnolo' : language === 'fr' ? 'francese' : language === 'de' ? 'tedesco' : 'inglese'}.`)
      memoryContext = parts.join(' | ')
    } catch {}

    // Load active agent
    let agentContext = ''
    try {
      const agents = JSON.parse(localStorage.getItem('vari-ai-agents') || '[]')
      const active = agents.find((a: any) => a.active)
      if (active) agentContext = `Active agent: ${active.name} (${active.description})`
    } catch {}

    // Set Jarvis status based on intent
    const searchTriggers = /\b(cerca|ricerca|dimmi|spiega|chi è|chi era|what is|who is|tell me about|storia|approfondisci|informazioni su|parlami di|notizie|news|oggi|quando|dove|perché|why|when|where|how)\b/i
    const isCodeReq = /\b(crea|create|scrivi|write|build|genera|code|script|programma|funzione|componente)\b/i
    const shouldSearch = searchTriggers.test(trimmed) && !isCodeReq.test(trimmed) && trimmed.length > 8
    if (zipContents) {
      setAgentStatus({ phase: 'reading', label: 'Analisi file ZIP…', detail: `${zipContents.length} file` })
    } else if (shouldSearch) {
      setIsSearching(true)
      setAgentStatus({ phase: 'searching', label: 'Ricerca web…', detail: trimmed.slice(0, 50) })
    } else if (isCodeReq.test(trimmed)) {
      setAgentStatus({ phase: 'coding', label: 'Generazione codice…' })
    } else {
      setAgentStatus({ phase: 'thinking', label: 'Elaborazione…' })
    }

    // ── Web search ────────────────────────────────────────────────────────────
    let searchContext = ''
    if (shouldSearch) {
      try {
        const sr = await fetch('/api/web-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmed, language }),
        })
        if (sr.ok) {
          const { results } = await sr.json()
          if (results?.length) {
            searchContext = '\n\n[WEB SEARCH RESULTS]\n' +
              results.map((r: any) => `• ${r.title}: ${r.snippet}`).join('\n') +
              '\n[END SEARCH RESULTS]\nUsa queste informazioni per rispondere.'
          }
        }
      } catch { /* ignora errori di ricerca */ }
      setIsSearching(false)
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ── Context compression (se la conversazione è lunga) ────────────────────
    let historyToSend = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
    if (messages.length > 20) {
      const oldMessages = messages.slice(0, messages.length - 10)
      const summary = oldMessages
        .filter(m => m.role === 'assistant')
        .map(m => m.content.slice(0, 100))
        .join(' | ')
      if (summary) {
        historyToSend = [
          { role: 'user', content: `[RIASSUNTO CONVERSAZIONE PRECEDENTE: ${summary.slice(0, 500)}]` },
          { role: 'assistant', content: 'Capito, ho il contesto della conversazione precedente.' },
          ...historyToSend,
        ]
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ── Vision: immagine allegata con modello vision ──────────────────────────
    const isVisionModel = aiModel.includes('vision')
    const imageFile = uploadedFiles.find(u => u.file.type.startsWith('image/'))
    let imageBase64: string | undefined
    if (isVisionModel && imageFile) {
      try {
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(imageFile.file)
        })
      } catch { /* ignora */ }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Helper: handle [GENERATE_PROJECT:...] — multi-file project generator
    const handleGenerateProject = async (projectRequest: string) => {
      const pid = (Date.now() + 10).toString()
      setMessages(prev => [...prev, {
        id: pid, role: 'assistant',
        content: `⚙️ **Generazione progetto in corso…**\n\nPianificazione architettura e scrittura file. Attendi 1-2 minuti.`,
        timestamp: new Date(),
      }])
      setAgentStatus({ phase: 'coding', label: 'Generazione progetto…', detail: projectRequest.slice(0, 50) })
      try {
        const gr = await fetch('/api/generate-project', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request: projectRequest, model: aiModel, language }),
        })
        if (!gr.ok) throw new Error('Generation failed')
        const projectName = gr.headers.get('X-Project-Name') ?? 'project'
        const fileCount = gr.headers.get('X-File-Count') ?? '?'
        const filesJson = gr.headers.get('X-Files-Json')
        const pFiles = filesJson ? JSON.parse(filesJson) : []
        const blob = await gr.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `${projectName}.zip`; a.click()
        URL.revokeObjectURL(url)
        setMessages(prev => prev.map(m => m.id === pid ? {
          ...m, content: `✅ **Progetto "${projectName}" generato!**\n\n${fileCount} file creati e scaricati automaticamente.`,
          files: pFiles,
        } : m))
        pushActivity({ type: 'code', label: `Progetto generato`, detail: `${fileCount} file` })
      } catch {
        setMessages(prev => prev.map(m => m.id === pid ? {
          ...m, content: '❌ Errore nella generazione. Riprova con un progetto più semplice.',
        } : m))
      }
    }

    // Helper: process a full response string
    const processFullResponse = (fullText: string, repackFilesData?: any[]) => {
      let cleanContent = fullText
      let parsedFiles: Array<{ path: string; content: string }> | undefined
      let gameKeyword: string | undefined

      // [GENERATE_PROJECT:...] — handled async separately
      const genMatch = fullText.match(/\[GENERATE_PROJECT:\s*([\s\S]+?)\]/i)
      if (genMatch) {
        setTimeout(() => handleGenerateProject(genMatch[1].trim()), 100)
        return { cleanContent: '', parsedFiles: undefined, gameKeyword: undefined }
      }

      const gameMatch = fullText.match(/\[GAME:(\w+)\]/i)
      if (gameMatch) {
        gameKeyword = gameMatch[1].toLowerCase()
        cleanContent = fullText.replace(/\[GAME:\w+\]/i, '').trim()
        pushActivity({ type: 'code', label: `Gioco ${gameKeyword} pronto`, detail: 'Clicca Download ZIP' })
      }

      if (/\[ZIP_REPACK\]/i.test(fullText) && repackFilesData?.length) {
        parsedFiles = repackFilesData
        cleanContent = fullText.replace(/\[ZIP_REPACK\]/i, '').trim()
        pushActivity({ type: 'zip', label: 'ZIP pronto per il download', detail: `${parsedFiles!.length} file` })
      }

      const filesMatch = fullText.match(/```files\n([\s\S]*?)```/)
      if (filesMatch) {
        try {
          parsedFiles = JSON.parse(filesMatch[1])
          cleanContent = fullText.replace(/```files\n[\s\S]*?```/, '').trim()
          pushActivity({ type: 'code', label: `${parsedFiles!.length} file generati`, detail: parsedFiles!.map(f => f.path).slice(0, 3).join(', ') })
        } catch { /* keep original */ }
      }

      return { cleanContent, parsedFiles, gameKeyword }
    }

    const finalizeMessage = (cleanContent: string, parsedFiles: any[] | undefined, gameKeyword: string | undefined, fullText: string) => {
      recordPrompt(aiMessage.length, cleanContent.length, Date.now() - requestStart)

      if (parsedFiles) {
        parsedFiles.forEach(f => {
          const ext = f.path.split('.').pop() || ''
          addFile({ name: f.path.split('/').pop() || f.path, ext, type: 'generated', size: f.content.length, content: f.content })
        })
        const htmlFile = parsedFiles.find(f => /\.(html|htm)$/.test(f.path))
        if (htmlFile) openPreview({ title: htmlFile.path, html: htmlFile.content })
        else if (parsedFiles[0]) {
          const ext = parsedFiles[0].path.split('.').pop() || 'code'
          openPreview({ title: parsedFiles[0].path, code: parsedFiles[0].content, lang: ext })
        }
      }

      setUploadedFiles([])
      setZipContents(null)
      setZipName(null)
    }

    try {
      const apiEndpoint = getAPIEndpoint(aiProvider)
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: aiMessage + searchContext,
          history: historyToSend,
          language,
          model: aiModel,
          zipFiles: zipContents,
          memoryContext,
          agentContext,
          imageBase64,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'API error')
      }

      const contentType = res.headers.get('content-type') || ''

      // ── SSE Streaming ───────────────────────────────────────────────────────
      if (contentType.includes('text/event-stream') && res.body) {
        const streamingId = (Date.now() + 1).toString()
        let fullText = ''

        setMessages(prev => [...prev, {
          id: streamingId, role: 'assistant', content: '', timestamp: new Date(),
        }])

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6)
            try {
              const json = JSON.parse(raw)
              if (json.token) {
                fullText += json.token
                setMessages(prev => prev.map(m =>
                  m.id === streamingId ? { ...m, content: fullText } : m
                ))
              }
              if (json.reset) {
                // Auto-reflection replaced the response
                fullText = json.reset
                setMessages(prev => prev.map(m =>
                  m.id === streamingId ? { ...m, content: fullText } : m
                ))
              }
              if (json.done) {
                const { cleanContent, parsedFiles, gameKeyword } = processFullResponse(fullText)
                setMessages(prev => prev.map(m => m.id === streamingId ? {
                  ...m, content: cleanContent, files: parsedFiles, gameKeyword,
                } : m))

                // Persist
                setMessages(prev => {
                  if (convIdRef.current) {
                    const stored: StoredMessage[] = prev
                      .filter(m => m.id !== '1' || m.role !== 'assistant' || prev.length > 1)
                      .map(m => ({ ...m, timestamp: m.timestamp.getTime() }))
                    upsertConversation({
                      id: convIdRef.current!,
                      title: titleFromMessage(prev.find(m => m.role === 'user')?.content || 'New chat'),
                      messages: stored, createdAt: Date.now(), updatedAt: Date.now(),
                    })
                  }
                  return prev
                })
                finalizeMessage(cleanContent, parsedFiles, gameKeyword, fullText)
              }
            } catch { /* skip malformed */ }
          }
        }

      } else {
        // ── Fallback: plain JSON (error responses) ──────────────────────────
        const data = await res.json()
        const { cleanContent, parsedFiles, gameKeyword } = processFullResponse(
          data.response || '', data.repackFiles
        )

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(), role: 'assistant',
          gameKeyword, content: cleanContent, files: parsedFiles, timestamp: new Date(),
        }

        setMessages(prev => {
          const updated = [...prev, aiMsg]
          if (convIdRef.current) {
            const stored: StoredMessage[] = updated
              .filter(m => m.id !== '1' || m.role !== 'assistant' || updated.length > 1)
              .map(m => ({ ...m, timestamp: m.timestamp.getTime() }))
            upsertConversation({
              id: convIdRef.current, title: titleFromMessage(updated.find(m => m.role === 'user')?.content || 'New chat'),
              messages: stored, createdAt: Date.now(), updatedAt: Date.now(),
            })
          }
          return updated
        })
        finalizeMessage(cleanContent, parsedFiles, gameKeyword, data.response || '')
      }

    } catch (err: any) {
      const detail = err?.message && err.message !== 'API error' ? err.message : null
      const errorMsg = detail
        ? `**Errore.** ${detail}`
        : aiProvider === 'ollama'
          ? '**Connessione fallita.** Assicurati che Ollama sia in esecuzione (`ollama serve`).'
          : aiProvider === 'groq'
            ? '**Connessione fallita.** Verifica che GROQ_API_KEY sia configurata in .env.local.'
            : '**Connessione fallita.** Verifica che GEMINI_API_KEY sia configurata in .env.local.'
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: errorMsg,
        timestamp: new Date(),
      }])
    } finally {
      setIsTyping(false)
      setIsSearching(false)
      setAgentStatus(null)
    }
  }

  const handleDownloadFiles = async (files: Array<{ path: string; content: string; name?: string }>) => {
    try {
      // Extract project name from the "name" field the AI sets on each file
      const projectName = files[0]?.name || undefined

      const res = await fetch('/api/generate-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, projectName }),
      })
      if (!res.ok) throw new Error('Failed to generate ZIP')

      // Get filename from Content-Disposition header if available
      const disposition = res.headers.get('Content-Disposition') || ''
      const match = disposition.match(/filename="?([^"]+)"?/)
      const filename = match?.[1] || `${projectName || 'project'}.zip`

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Failed to download. Please try again.')
    }
  }

  const getFileIcon = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (['jpg','jpeg','png','gif','webp'].includes(ext)) return <ImageIcon className="w-3 h-3" />
    if (['pdf','doc','docx'].includes(ext)) return <FileText className="w-3 h-3" />
    return <File className="w-3 h-3" />
  }

  const selectedModel = aiModels.find(m => m.code === aiModel)
  const selectedLang = languages.find(l => l.code === language)

  return (
    <div className="h-full flex flex-col rounded-xl overflow-hidden"
      style={{ background: 'var(--vari-card)', border: '1px solid var(--vari-border)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
        style={{ borderColor: 'var(--vari-border)', background: 'rgba(13,13,20,0.6)' }}>
        <div className="flex items-center gap-2.5">
          <Logo className="w-7 h-7" />
          <div>
            <div className="text-sm font-semibold leading-tight" style={{ color: 'var(--vari-light)' }}>V-AI</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Cpu className="w-2.5 h-2.5" style={{ color: 'var(--vari-muted)' }} />
              <span className="text-[10px]" style={{ color: 'var(--vari-muted)' }}>{selectedModel?.name ?? aiModel}</span>
              <span style={{ color: 'var(--vari-border)' }}>·</span>
              <Globe className="w-2.5 h-2.5" style={{ color: 'var(--vari-muted)' }} />
              <span className="text-[10px]" style={{ color: 'var(--vari-muted)' }}>{selectedLang?.flag} {selectedLang?.name}</span>
            </div>
          </div>
        </div>
        <button onClick={() => setShowSettings(s => !s)}
          className="p-1.5 rounded-lg transition-colors"
          style={{
            background: showSettings ? 'rgba(99,102,241,0.12)' : 'transparent',
            color: showSettings ? 'var(--vari-primary)' : 'var(--vari-muted)',
            border: `1px solid ${showSettings ? 'rgba(99,102,241,0.25)' : 'transparent'}`,
          }}>
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

{/* Settings panel */}
      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
            className="overflow-hidden border-b shrink-0"
            style={{ borderColor: 'var(--vari-border)', background: 'rgba(255,255,255,0.015)' }}>
            <div className="px-4 py-3 space-y-3">

              {/* Provider AI */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'var(--vari-muted)' }}>Provider AI</p>
                <div className="flex gap-1 mb-2 flex-wrap">
                  {(['ollama', 'groq'] as const).map(p => (
                    <button key={p}
                      onClick={() => {
                        const firstModel = aiModelsByProvider[p]?.[0]?.code ?? aiModel
                        setAiProvider(p)
                        setAiModel(firstModel)
                        localStorage.setItem('ai-provider', p)
                        localStorage.setItem('ai-model', firstModel)
                        window.dispatchEvent(new CustomEvent('ai-provider-changed', { detail: { provider: p, model: firstModel } }))
                      }}
                      className="px-3 py-1 rounded-md text-[11px] font-medium"
                      style={
                        aiProvider === p
                          ? { background: 'rgba(99,102,241,0.15)', color: 'var(--vari-primary)', border: '1px solid rgba(99,102,241,0.3)' }
                          : { background: 'rgba(255,255,255,0.03)', color: 'var(--vari-muted)', border: '1px solid var(--vari-border)' }
                      }>
                      {{ ollama: '🏠 Locale', groq: '⚡ Groq' }[p]}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {aiModels.map(m => (
                    <button key={m.code} onClick={() => setAiModel(m.code)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium"
                      style={{
                        background: aiModel === m.code ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                        color: aiModel === m.code ? 'var(--vari-primary)' : 'var(--vari-muted)',
                        border: `1px solid ${aiModel === m.code ? 'rgba(99,102,241,0.3)' : 'var(--vari-border)'}`,
                      }}>
                      {m.name}
                      {m.badge && (
                        <span className="text-[9px] px-1 rounded font-bold"
                          style={{ background: 'rgba(6,182,212,0.12)', color: '#06b6d4' }}>
                          {m.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lingua */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'var(--vari-muted)' }}>Lingua risposta</p>
                <div className="flex flex-wrap gap-1">
                  {languages.map(l => (
                    <button key={l.code} onClick={() => setLanguage(l.code)}
                      className="px-2 py-1 rounded-md text-[11px] font-medium"
                      style={{
                        background: language === l.code ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                        color: language === l.code ? 'var(--vari-primary)' : 'var(--vari-muted)',
                        border: `1px solid ${language === l.code ? 'rgba(99,102,241,0.3)' : 'var(--vari-border)'}`,
                      }}>
                      {l.flag} {l.name}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5"
        style={{ background: 'rgba(7,7,15,0.35)' }}>

        {!mounted ? (
          <div className="flex justify-center py-16">
            <div className="w-5 h-5 border-2 rounded-full animate-spin"
              style={{ borderColor: 'rgba(99,102,241,0.2)', borderTopColor: 'var(--vari-primary)' }} />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                {msg.role === 'assistant' && (
                  <div className="shrink-0 mt-0.5"><Logo className="w-6 h-6" /></div>
                )}

                <div className="max-w-[85%] space-y-2">
                  {/* ZIP badge */}
                  {msg.zipInfo && (
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs"
                      style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--vari-primary)' }}>
                      <Archive className="w-3 h-3" />
                      <span>{msg.zipInfo.name}</span>
                      <span style={{ color: 'var(--vari-muted)' }}>· {msg.zipInfo.fileCount} files</span>
                    </div>
                  )}

                  {/* Bubble */}
                  <div className="rounded-xl px-3.5 py-2.5"
                    style={msg.role === 'user'
                      ? { background: 'rgba(99,102,241,0.16)', border: '1px solid rgba(99,102,241,0.22)' }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid var(--vari-border)' }}>

                    {msg.role === 'assistant'
                      ? <div className="space-y-1">{renderMarkdown(msg.content)}</div>
                      : <p className="text-sm leading-relaxed" style={{ color: 'var(--vari-light)' }}>{msg.content}</p>
                    }

                    {/* Game download button */}
                    {msg.gameKeyword && (
                      <GameDownloadButton keyword={msg.gameKeyword} />
                    )}

                    {/* Generated files */}
                    {msg.files && msg.files.length > 0 && (
                      <div className="mt-3 rounded-lg overflow-hidden"
                        style={{ border: '1px solid rgba(99,102,241,0.2)' }}>
                        <div className="flex items-center justify-between px-3 py-2"
                          style={{ background: 'rgba(99,102,241,0.08)', borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
                          <div className="flex items-center gap-2">
                            <FolderArchive className="w-3.5 h-3.5" style={{ color: 'var(--vari-primary)' }} />
                            <span className="text-xs font-medium" style={{ color: 'var(--vari-light)' }}>
                              {msg.files.length} file{msg.files.length > 1 ? 's' : ''} generated
                            </span>
                          </div>
                          <button onClick={() => handleDownloadFiles(msg.files!)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)', color: 'white' }}>
                            <Download className="w-3 h-3" />
                            Download ZIP
                          </button>
                        </div>
                        <div className="divide-y" style={{ divideColor: 'var(--vari-border)' } as any}>
                          {msg.files.slice(0, 5).map((file, idx) => (
                            <FilePreviewRow key={idx} file={file} />
                          ))}
                          {msg.files.length > 5 && (
                            <div className="px-3 py-2 text-[10px] text-center" style={{ color: 'var(--vari-muted)' }}>
                              +{msg.files.length - 5} more files
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] mt-2 font-mono select-none" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="shrink-0 mt-0.5"><UserAvatar className="w-6 h-6" /></div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {isTyping && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex gap-3">
            <div className="shrink-0 mt-0.5"><Logo className="w-6 h-6" /></div>

            <div className="flex-1 max-w-[88%] rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--vari-border)', background: 'rgba(255,255,255,0.03)' }}>

              {/* Status row */}
              <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                {/* Phase icon */}
                {agentStatus?.phase === 'searching' || isSearching ? (
                  <motion.svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#06b6d4' }}
                    animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </motion.svg>
                ) : agentStatus?.phase === 'coding' ? (
                  <motion.svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#34d399' }}
                    animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                  </motion.svg>
                ) : agentStatus?.phase === 'reading' ? (
                  <motion.svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#fbbf24' }}
                    animate={{ y: [0, -2, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </motion.svg>
                ) : agentStatus?.phase === 'planning' ? (
                  <motion.svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#a78bfa' }}
                    animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                  </motion.svg>
                ) : (
                  <div className="flex items-center gap-1">
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                        style={{ background: 'var(--vari-primary)' }}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay }} />
                    ))}
                  </div>
                )}

                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium" style={{ color: 'var(--vari-light)' }}>
                    {agentStatus?.label ?? 'V-AI sta elaborando…'}
                  </span>
                  {agentStatus?.detail && (
                    <span className="text-[10px] truncate" style={{ color: 'var(--vari-muted)' }}>
                      {agentStatus.detail}
                    </span>
                  )}
                </div>
              </div>

              {/* Animated progress bar */}
              <div className="h-0.5 w-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <motion.div className="h-full" style={{
                  background: agentStatus?.phase === 'searching' ? 'linear-gradient(90deg,#06b6d4,#6366f1)'
                    : agentStatus?.phase === 'coding' ? 'linear-gradient(90deg,#34d399,#06b6d4)'
                    : agentStatus?.phase === 'reading' ? 'linear-gradient(90deg,#fbbf24,#f97316)'
                    : agentStatus?.phase === 'planning' ? 'linear-gradient(90deg,#a78bfa,#ec4899)'
                    : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                }}
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t" style={{ borderColor: 'var(--vari-border)', background: 'var(--vari-card)' }}>

        {/* File chips */}
        {(uploadedFiles.length > 0 || !!zipContents) && (
          <div className="px-3 pt-2.5 flex flex-wrap gap-1.5">
            {zipContents && zipName && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--vari-primary)' }}>
                <Archive className="w-3 h-3" />
                <span className="max-w-[140px] truncate">{zipName}</span>
                <span className="opacity-60">({zipContents.length} files)</span>
                <button onClick={clearZip} className="ml-0.5 opacity-70 hover:opacity-100" style={{ color: 'var(--vari-error)' }}>
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
            {uploadedFiles.map((u, i) => (
              <motion.div key={i} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
                style={{
                  background: !u.loading && u.text === null ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${!u.loading && u.text === null ? 'rgba(239,68,68,0.25)' : 'var(--vari-border)'}`,
                  color: 'var(--vari-light)',
                }}>
                {u.loading
                  ? <div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(99,102,241,0.3)', borderTopColor: 'var(--vari-primary)' }} />
                  : getFileIcon(u.file)}
                <span className="max-w-[120px] truncate">{u.file.name}</span>
                {!u.loading && u.text !== null && (
                  <span className="text-[9px] px-1 rounded" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--vari-success)' }}>
                    {u.text.length > 1000 ? `${(u.text.length / 1000).toFixed(1)}k` : `${u.text.length}b`}
                  </span>
                )}
                {!u.loading && u.text === null && (
                  <span className="text-[9px]" style={{ color: 'var(--vari-error)' }}>non leggibile</span>
                )}
                <button onClick={() => removeFile(i)} style={{ color: 'var(--vari-error)' }}>
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 p-3">
          <input ref={fileInputRef} type="file" multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.zip,.txt,.md,.py,.js,.ts,.jsx,.tsx,.html,.css,.json,.csv"
            onChange={handleFileUpload} className="hidden" />

          <button onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg transition-all shrink-0"
            title="Attach file or ZIP"
            style={{
              background: (uploadedFiles.length > 0 || zipContents) ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
            color: (uploadedFiles.length > 0 || zipContents) ? 'var(--vari-primary)' : 'var(--vari-muted)',
            border: `1px solid ${(uploadedFiles.length > 0 || zipContents) ? 'rgba(99,102,241,0.25)' : 'var(--vari-border)'}`,
            }}>
            <Paperclip className="w-4 h-4" />
          </button>

          <button onClick={toggleVoice}
            className="p-2 rounded-lg transition-all shrink-0"
            title="Voice input"
            style={{
              background: isListening ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)',
              color: isListening ? 'var(--vari-error)' : 'var(--vari-muted)',
              border: `1px solid ${isListening ? 'rgba(239,68,68,0.25)' : 'var(--vari-border)'}`,
            }}>
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
            }}
            placeholder={zipContents ? `Ask about ${zipName}…` : 'Ask V-AI anything…'}
            rows={1}
            disabled={isTyping}
            className="flex-1 rounded-lg px-3.5 py-2 text-sm outline-none resize-none disabled:opacity-50"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--vari-border)',
              color: 'var(--vari-light)',
              minHeight: '40px',
              maxHeight: '120px',
              lineHeight: '1.5',
            }}
          />

          <button onClick={handleSend}
            disabled={(!input.trim() && uploadedFiles.length === 0 && !zipContents) || isTyping || uploadedFiles.some(u => u.loading)}
            className="p-2 rounded-lg shrink-0 transition-all disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)', color: 'white' }}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function GameDownloadButton({ keyword }: { keyword: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [previewed, setPreviewed] = useState(false)

  const names: Record<string, string> = {
    snake: 'Snake', '2048': '2048', memory: 'Memory', tetris: 'Tetris',
  }
  const label = names[keyword] || keyword

  // Auto-open preview when game button appears
  useEffect(() => {
    if (previewed) return
    fetch('/api/create-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword }),
    }).then(async res => {
      if (!res.ok) return
      // Re-fetch as text to get the HTML from the ZIP
      // Actually just fetch the game HTML directly from create-game with ?preview=1
    }).catch(() => {})
    // Preview via dedicated endpoint
    fetch('/api/game-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword }),
    }).then(async res => {
      if (!res.ok) return
      const { html } = await res.json()
      if (html) openPreview({ title: `${label} — Preview`, html })
      setPreviewed(true)
    }).catch(() => {})
  }, [keyword])

  const download = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/create-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      })
      if (!res.ok) throw new Error('failed')
      const disposition = res.headers.get('Content-Disposition') || ''
      const match = disposition.match(/filename="?([^"]+)"?/)
      const filename = match?.[1] || `${keyword}-game.zip`
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
      setDone(true)
    } catch { alert('Download fallito. Riprova.') }
    finally { setLoading(false) }
  }

  return (
    <div className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-lg"
      style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
      <Gamepad2 className="w-4 h-4 shrink-0" style={{ color: 'var(--vari-primary)' }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold" style={{ color: 'var(--vari-light)' }}>
          Gioco {label} pronto
        </p>
        <p className="text-[10px]" style={{ color: 'var(--vari-muted)' }}>
          Codice testato, funziona subito nel browser
        </p>
      </div>
      <button onClick={download} disabled={loading || done}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all disabled:opacity-60"
        style={{ background: done ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg,#6366F1,#06B6D4)', color: done ? 'var(--vari-success)' : 'white' }}>
        {loading
          ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : done ? <><Check className="w-3 h-3" /> Scaricato</> : <><Download className="w-3 h-3" /> Download ZIP</>
        }
      </button>
    </div>
  )
}

function FilePreviewRow({ file }: { file: { path: string; content: string } }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
        style={{ color: 'var(--vari-muted)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
        <ChevronRight className="w-3 h-3 shrink-0 transition-transform" style={{ transform: open ? 'rotate(90deg)' : '' }} />
        <FileText className="w-3 h-3 shrink-0" />
        <span className="flex-1 truncate font-mono">{file.path}</span>
        <span style={{ color: 'var(--vari-border)' }}>{file.content.length > 1000 ? `${(file.content.length / 1000).toFixed(1)}k` : `${file.content.length}b`}</span>
      </button>
      {open && (
        <pre className="px-3 pb-3 text-[10px] font-mono overflow-x-auto leading-relaxed"
          style={{ color: 'var(--vari-muted)', background: 'rgba(0,0,0,0.2)' }}>
          {file.content.slice(0, 600)}{file.content.length > 600 ? '\n…' : ''}
        </pre>
      )}
    </div>
  )
}
