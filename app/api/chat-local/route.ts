import { NextRequest } from 'next/server'
import { buildChatContext } from '@/lib/brain/context'
import { createSession, updateSessionMetadata } from '@/lib/brain/sessions'

// ── Intent detection ──────────────────────────────────────────────────────────

type Intent = 'code' | 'research' | 'translate' | 'rewrite' | 'math' | 'chat' | 'file'

function detectIntent(msg: string, hasZip: boolean): Intent {
  const m = msg.toLowerCase()
  if (hasZip) return 'file'
  if (/\b(crea|create|scrivi|write|build|genera|fai|make|sviluppa|develop)\b/.test(m) &&
      /\b(codice|code|script|app|applicazione|sito|website|funzione|function|classe|class|programma|program|component|api|server|bot)\b/.test(m))
    return 'code'
  if (/\b(calcola|calculate|risolvi|solve|quanto fa|dimostra|deriva|integra|equazione|equation|formula)\b/.test(m))
    return 'math'
  if (/\b(traduci|translate|traduzione|translation)\b/.test(m))
    return 'translate'
  if (/\b(riscrivi|rewrite|riassumi|summarize|riassunto|summary|parafrasa|correggi|migliora|improve)\b/.test(m))
    return 'rewrite'
  if (/\b(chi è|chi era|cos'è|cos è|cosa è|what is|who is|spiega|explain|dimmi|tell me|cerca|search|ricerca|research|parlami|storia|history|analizza|analyze|approfondisci|informazioni)\b/.test(m))
    return 'research'
  return 'chat'
}

// ── Per-intent system prompts ─────────────────────────────────────────────────

const INTENT_PROMPTS: Record<Intent, string> = {
  code: `You are a coding assistant. When asked to create code:
- For a single file: use a \`\`\`language code block.
- For a small project (2-5 files): use ONLY this format:
\`\`\`files
[{"name":"project-name","path":"filename.ext","content":"FULL CODE HERE"}]
\`\`\`
- For a large project (6+ files): respond with ONLY this tag:
  [GENERATE_PROJECT: <repeat the user request verbatim>]
- Write COMPLETE code. Never use "...", never truncate.
- One short sentence AFTER explaining what you built.`,

  research: `You are a knowledgeable assistant answering a research question.
IMPORTANT: Write ONLY prose. Do NOT write any code. Do NOT suggest code.
Format your answer with markdown sections (## heading for each topic).
Write 2-3 paragraphs per section. Use **bold** for important names/dates.
Be thorough — at least 4 sections. Cite sources as (Wikipedia) inline.`,

  translate: `You are a professional translator.
Output ONLY the translation. No explanations, no comments, no code.
Preserve the original formatting.`,

  rewrite: `You are an expert editor.
Output ONLY the rewritten/summarized text. No code. No commentary.`,

  math: `You are a mathematics tutor.
Solve step by step. No code unless asked. End with the answer in **bold**.`,

  chat: `You are V-AI, a helpful and direct AI assistant.
Answer concisely and accurately. Use markdown where it helps clarity.
Do NOT write code unless the user explicitly asks for it.`,

  file: `You are analyzing files from a ZIP archive.
The file contents are shown above.
Respond based on what the user asks: summarize, explain, find bugs, or modify.
For modified files use:
\`\`\`files
[{"name":"project","path":"file.ext","content":"FULL CONTENT"}]
\`\`\`
No code if the user just wants an explanation.`,
}

// ── Game / ZIP shortcuts ──────────────────────────────────────────────────────

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

// ── Auto-reflection: the AI reviews its own response ─────────────────────────

async function reflectAndImprove(prompt: string, response: string, intent: Intent, model: string): Promise<string> {
  if (response.length < 200 || intent === 'translate' || intent === 'rewrite') return response

  const reflectionPrompt = `You are a strict quality reviewer. A user asked something and an AI responded.

=== ORIGINAL REQUEST (last part) ===
${prompt.slice(-400)}

=== AI RESPONSE ===
${response.slice(0, 1500)}

=== YOUR TASK ===
Does this response fully and accurately answer the question?
- If YES: respond with only "OK"
- If NO: respond with "IMPROVE:" followed by the complete improved response

Respond with ONLY "OK" or "IMPROVE:" + improved response:`

  try {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model, prompt: reflectionPrompt, stream: false,
        options: { temperature: 0.1, num_predict: 2048 },
      }),
    })
    if (!res.ok) return response
    const data = await res.json()
    const verdict: string = data.response?.trim() ?? ''
    if (verdict.startsWith('IMPROVE:')) {
      const improved = verdict.slice('IMPROVE:'.length).trim()
      if (improved.length > 80) return improved
    }
  } catch { /* fallback */ }
  return response
}

// ── JSON response helper ──────────────────────────────────────────────────────

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const {
      message, history, language = 'en', model = 'llama3.1:8b',
      zipFiles, memoryContext, agentContext, projectId, sessionId,
    } = await req.json()

    if (!message) return jsonResponse({ error: 'Message is required' }, 400)

    // Create session if not exists
    let currentSessionId = sessionId
    if (!currentSessionId && projectId) {
      const session = createSession(projectId)
      currentSessionId = session.id
    }

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

    // ── Shortcuts (no Ollama needed) ──────────────────────────────────────────

    const gameId = detectGame(message)
    if (gameId) {
      const names: Record<string,string> = { snake:'Snake','2048':'2048',memory:'Memory',tetris:'Tetris' }
      return jsonResponse({
        response: language==='it'
          ? `[GAME:${gameId}]\n\nHo creato **${names[gameId]}**. Clicca **Download ZIP** per scaricarlo.`
          : `[GAME:${gameId}]\n\nI created **${names[gameId]}**. Click **Download ZIP** to download it.`,
        timestamp: new Date().toISOString(),
      })
    }

    const lowerMsg = message.toLowerCase()
    const wantsZipDownload = /\b(mandami|inviami|scarica|download)\b/.test(lowerMsg) && /\b(zip|file\s*zip)\b/.test(lowerMsg)
    if (wantsZipDownload && (!zipFiles || zipFiles.length === 0)) {
      const rg = RANDOM_GAMES[Math.floor(Math.random()*4)]
      const names: Record<string,string> = { snake:'Snake','2048':'2048',memory:'Memory',tetris:'Tetris' }
      return jsonResponse({
        response: language==='it'
          ? `[GAME:${rg}]\n\nEcco **${names[rg]}** pronto da scaricare.`
          : `[GAME:${rg}]\n\nHere is **${names[rg]}** ready to download.`,
        timestamp: new Date().toISOString(),
      })
    }

    if (detectZipRepack(message, zipFiles?.length > 0)) {
      const textFiles = (zipFiles as any[]).filter(f => !f.isBinary)
      return jsonResponse({
        response: language==='it'
          ? `[ZIP_REPACK]\n\nEcco il tuo archivio con **${textFiles.length} file**. Clicca **Download ZIP**.`
          : `[ZIP_REPACK]\n\nHere is your archive with **${textFiles.length} files**. Click **Download ZIP**.`,
        repackFiles: textFiles.map((f: any) => ({ path: f.path, content: f.content, name: 'archive' })),
        timestamp: new Date().toISOString(),
      })
    }

    // ── Detect intent ─────────────────────────────────────────────────────────

    const intent = detectIntent(message, !!zipFiles?.length)

    // ── Brain context injection ───────────────────────────────────────────────

    let brainContext = ''
    if (projectId && currentSessionId) {
      try {
        brainContext = await buildChatContext(message, currentSessionId, projectId, 1500)
      } catch (error) {
        console.error('Brain context error:', error)
      }
    }

    // ── Web search for research ───────────────────────────────────────────────

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
            webContext = '=== SEARCH RESULTS ===\n'
            for (const r of results) webContext += `[${r.source}] ${r.title}\n${r.snippet}\n\n`
            webContext += '=== END SEARCH RESULTS ===\n\n'
          }
        }
      } catch { /* continue without search */ }
    }

    // ── Build prompt ──────────────────────────────────────────────────────────

    let prompt = INTENT_PROMPTS[intent] + '\n\n'
    prompt += `LANGUAGE: ${langMap[language] || langMap.en}\n\n`
    
    if (brainContext) prompt += brainContext + '\n\n'
    
    if (memoryContext) prompt += `USER CONTEXT: ${memoryContext}\n\n`

    if (agentContext) {
      const AGENT_STYLES: Record<string, string> = {
        dev:       'AGENT: Developer — technical, concise, lead with code.\n\n',
        research:  'AGENT: Researcher — thorough, structured, analytical.\n\n',
        writer:    'AGENT: Writer — fluent prose, polished, ready to publish.\n\n',
        marketing: 'AGENT: Marketing — persuasive, energetic, benefits-first.\n\n',
      }
      const aid = agentContext.toLowerCase().includes('developer') ? 'dev'
        : agentContext.toLowerCase().includes('research') ? 'research'
        : agentContext.toLowerCase().includes('writer') ? 'writer'
        : agentContext.toLowerCase().includes('marketing') ? 'marketing' : null
      if (aid && AGENT_STYLES[aid]) prompt += AGENT_STYLES[aid]
    }

    if (webContext) prompt += webContext

    if (zipFiles?.length > 0) {
      const texts = (zipFiles as any[]).filter(f => !f.isBinary)
      prompt += `=== ZIP FILE (${zipFiles.length} files) ===\n`
      for (const f of texts) {
        const c = f.content.length > 4000 ? f.content.slice(0, 4000) + '\n...[truncated]' : f.content
        prompt += `--- ${f.path} ---\n${c}\n\n`
      }
      prompt += '=== END ===\n\n'
    }

    for (const m of (history || []).slice(-8)) {
      prompt += `${m.role === 'user' ? 'User' : 'V-AI'}: ${m.content}\n\n`
    }
    prompt += `User: ${message}\n\nV-AI:`

    // ── Call Ollama with STREAMING ────────────────────────────────────────────

    try {
      const ollamaRes = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: true,
          options: {
            temperature: intent === 'code' ? 0.2 : intent === 'research' ? 0.4 : 0.7,
            top_p: 0.9, top_k: 40, repeat_penalty: 1.05, num_predict: 8192,
          },
        }),
      })

      if (!ollamaRes.ok || !ollamaRes.body) throw new Error('Ollama not responding')

      const encoder = new TextEncoder()
      let fullResponse = ''

      const readable = new ReadableStream({
        async start(controller) {
          const reader = ollamaRes.body!.getReader()
          const decoder = new TextDecoder()
          let buffer = ''

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() ?? ''

              for (const line of lines) {
                if (!line.trim()) continue
                try {
                  const json = JSON.parse(line)
                  if (json.response) {
                    fullResponse += json.response
                    controller.enqueue(encoder.encode(
                      `data: ${JSON.stringify({ token: json.response })}\n\n`
                    ))
                  }
                  if (json.done) {
                    // Strip any prefix the model may have added
                    for (const p of ['V-AI:', 'VARI AI:', 'Assistant:']) {
                      if (fullResponse.startsWith(p)) fullResponse = fullResponse.slice(p.length).trim()
                    }

                    // Auto-reflection (only for longer responses)
                    if (fullResponse.length > 200 && intent !== 'translate') {
                      const improved = await reflectAndImprove(prompt, fullResponse, intent, model)
                      if (improved !== fullResponse) {
                        // Send reset token so frontend replaces the full text
                        controller.enqueue(encoder.encode(
                          `data: ${JSON.stringify({ reset: improved })}\n\n`
                        ))
                      }
                    }

                    // Update session metadata
                    if (currentSessionId) {
                      try {
                        updateSessionMetadata(currentSessionId, {
                          messages_count: (history?.length || 0) + 1,
                          tokens_used: Math.ceil(fullResponse.length / 4),
                        })
                      } catch { /* non-critical */ }
                    }

                    controller.enqueue(encoder.encode(
                      `data: ${JSON.stringify({ done: true, intent, sessionId: currentSessionId })}\n\n`
                    ))
                  }
                } catch { /* skip malformed JSON lines */ }
              }
            }
          } finally {
            controller.close()
          }
        },
      })

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })

    } catch {
      return jsonResponse({
        response: language === 'it'
          ? `**Ollama non è in esecuzione.**\n\nAvvia Ollama, poi:\n\`\`\`bash\nollama pull llama3.1:8b\n\`\`\``
          : `**Ollama is not running.**\n\nStart Ollama then run:\n\`\`\`bash\nollama pull llama3.1:8b\n\`\`\``,
        timestamp: new Date().toISOString(),
      })
    }

  } catch (error) {
    console.error('Chat error:', error)
    return jsonResponse({ response: 'Errore inatteso. Riprova.', timestamp: new Date().toISOString() })
  }
}
