import { NextRequest, NextResponse } from 'next/server'

// ── Intent detection ──────────────────────────────────────────────────────────
// The model is too small to reliably infer intent from a generic system prompt.
// We detect intent server-side and give the model a single, focused instruction.

type Intent = 'code' | 'research' | 'translate' | 'rewrite' | 'math' | 'chat' | 'file'

function detectIntent(msg: string, hasZip: boolean): Intent {
  const m = msg.toLowerCase()

  if (hasZip) return 'file'

  // Code: explicit programming requests
  if (/\b(crea|create|scrivi|write|build|genera|fai|make|sviluppa|develop)\b/.test(m) &&
      /\b(codice|code|script|app|applicazione|sito|website|funzione|function|classe|class|programma|program|component|api|server|bot)\b/.test(m))
    return 'code'

  // Math
  if (/\b(calcola|calculate|risolvi|solve|quanto fa|dimostra|deriva|integra|equazione|equation|formula)\b/.test(m))
    return 'math'

  // Translation
  if (/\b(traduci|translate|traduzione|translation)\b/.test(m))
    return 'translate'

  // Rewrite / summary
  if (/\b(riscrivi|rewrite|riassumi|summarize|riassunto|summary|parafrasa|paraphrase|correggi|correct|migliora|improve)\b/.test(m))
    return 'rewrite'

  // Research / information
  if (/\b(chi è|chi era|cos'è|cos è|cosa è|what is|who is|spiega|explain|dimmi|tell me|cerca|search|ricerca|research|parlami|storia|history|analizza|analyze|approfondisci|informazioni)\b/.test(m))
    return 'research'

  return 'chat'
}

// ── Per-intent system prompts (short and direct for small models) ─────────────

const INTENT_PROMPTS: Record<Intent, string> = {

  code: `You are a coding assistant. When asked to create code:
- Write COMPLETE, working code. Never use "...", never truncate.
- For a single file: use a \`\`\`language code block.
- For multiple files: use ONLY this format:
\`\`\`files
[{"name":"project-name","path":"filename.ext","content":"FULL CODE HERE"}]
\`\`\`
- No prose before the code. One short sentence AFTER explaining what you built.`,

  research: `You are a knowledgeable assistant answering a research question.
IMPORTANT: Write ONLY prose. Do NOT write any code. Do NOT suggest code.
Format your answer with markdown sections:
## [Topic Name]
Write 2-3 paragraphs of detailed, factual information.
Use **bold** for important names/dates. Use bullet points for lists of facts.
Be thorough. Aim for at least 4 sections covering different aspects of the topic.
If search results are provided above, use them as your primary source and cite them.`,

  translate: `You are a professional translator.
Translate the user's text directly and completely.
Output ONLY the translation. No explanations, no comments, no code.
Preserve the original formatting (paragraphs, lists, etc.).`,

  rewrite: `You are an expert editor.
Rewrite or summarize the text as requested.
Output ONLY the rewritten/summarized text. No code. No meta-commentary.
Match the tone and style requested by the user.`,

  math: `You are a mathematics tutor.
Solve the problem step by step using clear notation.
Use markdown for formulas where helpful. No code unless explicitly asked.
Show your work clearly. End with the final answer highlighted in **bold**.`,

  chat: `You are V-AI, a helpful and direct AI assistant.
Answer the user's question concisely and accurately.
Use markdown where it adds clarity (bold, lists, headers).
Do NOT write code unless the user explicitly asks for code.`,

  file: `You are analyzing files from a ZIP archive uploaded by the user.
The file contents are shown above.
Respond based on what the user asks: summarize, explain, find bugs, or modify.
When returning modified files, use:
\`\`\`files
[{"name":"project","path":"filename.ext","content":"FULL CONTENT"}]
\`\`\`
No unnecessary code if the user just wants an explanation.`,
}

// ── Game detection ────────────────────────────────────────────────────────────

const GAME_MAP: Record<string, string> = {
  snake:'snake', serpente:'snake', '2048':'2048',
  memory:'memory', memoria:'memory', tetris:'tetris',
}
const RANDOM_GAMES = ['snake', '2048', 'memory', 'tetris']

function detectGame(msg: string): string | null {
  const m = msg.toLowerCase()
  const isAction = /\b(crea|create|fai|make|build|genera|scrivi|write|fammi|mandami)\b/.test(m)
  const isZip = /\b(zip|zippa|scarica|download|cartella\s+zippata)\b/.test(m)
  if (!isAction && !isZip) return null
  for (const [kw, id] of Object.entries(GAME_MAP)) if (m.includes(kw)) return id
  if (/\b(gioco|game|videogioco)\b/.test(m)) return RANDOM_GAMES[Math.floor(Math.random()*4)]
  return null
}

function detectZipRepack(msg: string, hasZip: boolean): boolean {
  return hasZip && /\b(zippa|zip|comprimi|scarica|download|mandami|inviami|pack|rimanda)\b/.test(msg.toLowerCase())
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const {
      message, history, language = 'en', model = 'llama3.2',
      zipFiles, memoryContext, agentContext,
    } = await req.json()

    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

    const langMap: Record<string, string> = {
      en:'Respond in English.',
      it:'Rispondi SEMPRE in Italiano.',
      es:'Responde siempre en Español.',
      fr:'Répondez toujours en Français.',
      de:'Antworte immer auf Deutsch.',
      pt:'Responda sempre em Português.',
      ru:'Отвечайте всегда на русском.',
      zh:'请始终用中文回答。',
      ja:'常に日本語で答えてください。',
    }

    // ── Server-side shortcuts (no Ollama needed) ──────────────────────────────

    const gameId = detectGame(message)
    if (gameId) {
      const names: Record<string,string> = { snake:'Snake','2048':'2048',memory:'Memory',tetris:'Tetris' }
      return NextResponse.json({
        response: language==='it'
          ? `[GAME:${gameId}]\n\nHo creato **${names[gameId]}**. Clicca **Download ZIP** per scaricarlo.`
          : `[GAME:${gameId}]\n\nI created **${names[gameId]}**. Click **Download ZIP** to download it.`,
        timestamp: new Date().toISOString(),
      })
    }

    const lowerMsg = message.toLowerCase()
    const wantsZipDownload = /\b(mandami|inviami|scarica|download)\b/.test(lowerMsg) && /\b(zip|file\s*zip)\b/.test(lowerMsg)
    if (wantsZipDownload && (!zipFiles || zipFiles.length===0)) {
      const rg = RANDOM_GAMES[Math.floor(Math.random()*4)]
      const names: Record<string,string> = { snake:'Snake','2048':'2048',memory:'Memory',tetris:'Tetris' }
      return NextResponse.json({
        response: language==='it'
          ? `[GAME:${rg}]\n\nEcco **${names[rg]}** pronto da scaricare.`
          : `[GAME:${rg}]\n\nHere is **${names[rg]}** ready to download.`,
        timestamp: new Date().toISOString(),
      })
    }

    if (detectZipRepack(message, zipFiles?.length>0)) {
      const textFiles = (zipFiles as any[]).filter(f=>!f.isBinary)
      return NextResponse.json({
        response: language==='it'
          ? `[ZIP_REPACK]\n\nEcco il tuo archivio con **${textFiles.length} file**. Clicca **Download ZIP**.`
          : `[ZIP_REPACK]\n\nHere is your archive with **${textFiles.length} files**. Click **Download ZIP**.`,
        repackFiles: textFiles.map((f:any)=>({ path:f.path, content:f.content, name:'archive' })),
        timestamp: new Date().toISOString(),
      })
    }

    // ── Detect intent & pick focused system prompt ────────────────────────────

    const intent = detectIntent(message, !!zipFiles?.length)
    const basePrompt = INTENT_PROMPTS[intent]

    // ── Web search for research intent ────────────────────────────────────────

    let webContext = ''
    if (intent === 'research') {
      try {
        const origin = req.nextUrl?.origin || 'http://localhost:3000'
        const sr = await fetch(`${origin}/api/web-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: message, language }),
        })
        if (sr.ok) {
          const { results } = await sr.json()
          if (results?.length > 0) {
            webContext = `=== SEARCH RESULTS ===\n`
            for (const r of results) {
              webContext += `[${r.source}] ${r.title}\n${r.snippet}\n\n`
            }
            webContext += `=== END SEARCH RESULTS ===\n\n`
          }
        }
      } catch { /* continue without search */ }
    }

    // ── Build focused prompt ──────────────────────────────────────────────────

    let prompt = basePrompt + '\n\n'
    prompt += `LANGUAGE: ${langMap[language] || langMap.en}\n\n`
    if (memoryContext) prompt += `USER CONTEXT: ${memoryContext}\n\n`

    // Agent personality
    if (agentContext) {
      const AGENT_STYLES: Record<string,string> = {
        dev:       'AGENT: Developer — be technical, concise, lead with code.\n\n',
        research:  'AGENT: Researcher — be thorough, structured, analytical.\n\n',
        writer:    'AGENT: Writer — fluent prose, polished, ready to publish.\n\n',
        marketing: 'AGENT: Marketing — persuasive, energetic, benefits-first.\n\n',
      }
      const aid = agentContext.toLowerCase().includes('developer')?'dev'
        :agentContext.toLowerCase().includes('research')?'research'
        :agentContext.toLowerCase().includes('writer')?'writer'
        :agentContext.toLowerCase().includes('marketing')?'marketing':null
      if (aid && AGENT_STYLES[aid]) prompt += AGENT_STYLES[aid]
    }

    if (webContext) prompt += webContext

    // ZIP file contents
    if (zipFiles?.length > 0) {
      const texts = (zipFiles as any[]).filter(f=>!f.isBinary)
      prompt += `=== ZIP FILE (${zipFiles.length} files) ===\n`
      for (const f of texts) {
        const c = f.content.length>4000 ? f.content.slice(0,4000)+'\n...[truncated]' : f.content
        prompt += `--- ${f.path} ---\n${c}\n\n`
      }
      prompt += `=== END ===\n\n`
    }

    // Conversation history
    for (const m of (history||[]).slice(-8)) {
      prompt += `${m.role==='user'?'User':'V-AI'}: ${m.content}\n\n`
    }
    prompt += `User: ${message}\n\nV-AI:`

    // ── Call Ollama ───────────────────────────────────────────────────────────

    try {
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature: intent==='code' ? 0.2 : intent==='research' ? 0.4 : 0.7,
            top_p: 0.9, top_k: 40, repeat_penalty: 1.05, num_predict: 8192,
          },
        }),
      })
      if (!res.ok) throw new Error('Ollama not responding')

      const data = await res.json()
      let response: string = data.response.trim()
      for (const p of ['V-AI:','VARI AI:','Assistant:']) {
        if (response.startsWith(p)) response = response.slice(p.length).trim()
      }
      return NextResponse.json({ response, intent, timestamp: new Date().toISOString() })

    } catch {
      return NextResponse.json({
        response: language==='it'
          ? `**Ollama non è in esecuzione.**\n\nAvvia Ollama, poi:\n\`\`\`bash\nollama pull llama3.2\n# oppure (migliore per codice):\nollama pull qwen2.5-coder:7b\n\`\`\``
          : `**Ollama is not running.**\n\nStart Ollama then run:\n\`\`\`bash\nollama pull llama3.2\n\`\`\``,
        timestamp: new Date().toISOString(),
      })
    }

  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ response: 'Errore inatteso. Riprova.', timestamp: new Date().toISOString() })
  }
}
