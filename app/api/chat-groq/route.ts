import { NextRequest } from 'next/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const GEMINI_MODELS = ['gemini-pro', 'gemini-1.5-flash', 'gemini-1.5-pro']

async function handleGemini(message: string, history: any[], model: string, language: string) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`

  const contents = [
    ...history.slice(-10).map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ]

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Gemini API error')
  }

  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
            break
          }
          const chunk = decoder.decode(value, { stream: true })
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue
            try {
              const json = JSON.parse(line.slice(6))
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: text })}\n\n`))
              }
            } catch { /* skip */ }
          }
        }
      } finally {
        controller.close()
      }
    },
  })
}

const VISION_MODELS = ['llama-3.2-11b-vision-preview', 'llama-3.2-90b-vision-preview']

export async function POST(req: NextRequest) {
  try {
    const {
      message,
      history = [],
      model = 'llama-3.1-8b-instant',
      language = 'it',
      imageBase64,
      memoryContext = '',
      agentContext = '',
    } = await req.json()

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Route Gemini models to Gemini API
    if (GEMINI_MODELS.includes(model)) {
      const stream = await handleGemini(message, history, model, language)
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Groq models
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const isVision = VISION_MODELS.includes(model) && imageBase64

    const userContent: any = isVision
      ? [
          { type: 'text', text: message || 'Descrivi questa immagine in dettaglio.' },
          { type: 'image_url', image_url: { url: imageBase64 } },
        ]
      : message

    const messages: any[] = [
      {
        role: 'system',
        content: [
          `You are V-AI, a highly capable personal AI assistant. Be concise, accurate and helpful.`,
          memoryContext ? `Context: ${memoryContext}` : '',
          agentContext ? agentContext : '',
        ].filter(Boolean).join('\n'),
      },
      ...history.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userContent },
    ]

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      const msg = response.status === 429
        ? 'Limite richieste Groq superato. Aspetta qualche secondo e riprova.'
        : error.error?.message || 'Groq API error'
      return new Response(
        JSON.stringify({ error: msg }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter(l => l.trim() !== '')
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
                  continue
                }
                try {
                  const json = JSON.parse(data)
                  const content = json.choices?.[0]?.delta?.content
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: content })}\n\n`))
                  }
                } catch { /* skip */ }
              }
            }
          }
        } catch (err) {
          console.error('Groq streaming error:', err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
