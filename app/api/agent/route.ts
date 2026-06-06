import { NextRequest, NextResponse } from 'next/server'
import { buildMemoryContext, saveMemory } from '@/lib/memory'
import { buildAgentContext } from '@/lib/brain/context'
import { getAITasks, updateTask } from '@/lib/brain/tasks'

type AgentStep = {
  type: 'plan' | 'tool' | 'think' | 'answer'
  content: string
  toolName?: string
}

async function ollama(prompt: string, model: string, temperature = 0.3, maxTokens = 2048): Promise<string> {
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model, prompt, stream: false,
      options: { temperature, top_p: 0.9, num_predict: maxTokens },
    }),
  })
  if (!res.ok) throw new Error('Ollama non risponde')
  return (await res.json()).response?.trim() ?? ''
}

async function callTool(name: string, params: Record<string, string>, origin: string): Promise<string> {
  try {
    const res = await fetch(`${origin}/api/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: name, params }),
    })
    return (await res.json()).result ?? 'Nessun risultato'
  } catch {
    return `Tool ${name} non disponibile`
  }
}

async function planSteps(message: string, model: string): Promise<string[]> {
  const resp = await ollama(
    `You are a task planner. Break this request into 2-4 concrete steps. Each step = one action.
Request: "${message}"
Respond with ONLY a numbered list:
1. Step one
2. Step two
Steps:`,
    model, 0.2, 512
  )
  const lines = resp.split('\n').filter(l => /^\d+\./.test(l.trim()))
  return lines.length ? lines.map(l => l.replace(/^\d+\.\s*/, '').trim()) : [message]
}

async function executeStep(step: string, context: string, model: string, origin: string): Promise<AgentStep> {
  const decision = await ollama(
    `Step: "${step}"
Context: ${context.slice(-400)}
Available tools: search_web|query=..., read_file|filepath=..., list_files|dirpath=..., run_terminal|command=...
If a tool is needed respond with: USE_TOOL: tool_name | param=value
Otherwise respond with: NO_TOOL`,
    model, 0.1, 128
  )

  if (decision.startsWith('USE_TOOL:')) {
    const parts = decision.replace('USE_TOOL:', '').trim().split('|')
    const toolName = parts[0].trim()
    const params: Record<string, string> = {}
    for (const p of parts.slice(1)) {
      const [k, ...v] = p.split('=')
      if (k) params[k.trim()] = v.join('=').trim()
    }
    const result = await callTool(toolName, params, origin)
    const interp = await ollama(
      `Tool "${toolName}" returned:\n${result.slice(0, 1500)}\nStep: "${step}"\nSummarize what you found (2-3 sentences):`,
      model, 0.4, 512
    )
    return { type: 'tool', content: interp, toolName }
  }

  const thought = await ollama(
    `Complete this step with your knowledge.\nStep: "${step}"\nContext: ${context.slice(-600)}\nBe concise (3-5 sentences):`,
    model, 0.5, 512
  )
  return { type: 'think', content: thought }
}

async function finalize(question: string, steps: AgentStep[], model: string, language: string): Promise<string> {
  const langMap: Record<string, string> = { it:'Rispondi in italiano.', en:'Respond in English.', es:'Responde en español.', fr:'Réponds en français.' }
  const ctx = steps.map((s, i) => `Step ${i+1}: ${s.content}`).join('\n\n')
  return await ollama(
    `You are V-AI. Write a complete answer based on the research below.
Question: "${question}"
Research:\n${ctx}
${langMap[language] ?? langMap.en}
Write a clear, well-structured answer using markdown. Do NOT mention "steps" or "research":`,
    model, 0.6, 4096
  )
}

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], language = 'it', model = 'llama3.1:8b', memoryContext, projectId } = await req.json()
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

    const origin = req.nextUrl?.origin || 'http://localhost:3000'

    // Load DB memory
    let dbMem = ''
    try { dbMem = buildMemoryContext(message) } catch {}
    
    // Load brain project context
    let brainCtx = ''
    if (projectId) {
      try { brainCtx = await buildAgentContext(projectId, 1000) } catch {}
    }
    
    const fullMemory = [memoryContext, dbMem, brainCtx].filter(Boolean).join(' | ')

    // Simple messages → direct answer
    const isSimple = message.length < 80 && !/\b(crea|analizza|cerca|spiega|costruisci|genera|ricerca|trova|leggi|modifica)\b/i.test(message)
    if (isSimple) {
      const direct = await ollama(
        `You are V-AI. Answer concisely.\n${fullMemory ? `Context: ${fullMemory}\n` : ''}Language: ${language}\nQuestion: ${message}\nAnswer:`,
        model, 0.6, 1024
      )
      return NextResponse.json({ response: direct, agentSteps: [], mode: 'direct', timestamp: new Date().toISOString() })
    }

    // Agent loop
    const steps: AgentStep[] = []
    let context = `Question: ${message}\n${fullMemory ? `Context: ${fullMemory}\n` : ''}`

    // Check if working on a specific task
    let activeTask = null
    if (projectId) {
      const aiTasks = getAITasks(projectId, 1)
      if (aiTasks.length > 0 && aiTasks[0].status === 'open') {
        activeTask = aiTasks[0]
        context += `\nActive Task: ${activeTask.title}\n${activeTask.description || ''}`
        // Mark as in_progress
        try { updateTask(activeTask.id, { status: 'in_progress' }) } catch {}
      }
    }

    const plan = await planSteps(message, model)
    steps.push({ type: 'plan', content: plan.join(' → ') })

    for (const step of plan.slice(0, 4)) {
      const result = await executeStep(step, context, model, origin)
      steps.push(result)
      context += `\nStep "${step}": ${result.content}`
    }

    const finalAnswer = await finalize(message, steps, model, language)

    // Mark task as done if completed successfully
    if (activeTask && !finalAnswer.toLowerCase().includes('error')) {
      try { updateTask(activeTask.id, { status: 'done' }) } catch {}
    }

    return NextResponse.json({
      response: finalAnswer,
      agentSteps: steps,
      mode: 'agent',
      activeTask: activeTask?.id,
      timestamp: new Date().toISOString(),
    })

  } catch (err: any) {
    console.error('[agent]', err)
    return NextResponse.json({
      response: '**Ollama non è in esecuzione.** Avvialo con `ollama serve`.',
      agentSteps: [], mode: 'error', timestamp: new Date().toISOString(),
    })
  }
}
