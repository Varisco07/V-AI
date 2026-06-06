import { NextRequest } from 'next/server'
import { buildChatContext } from '@/lib/brain/context'
import { createSession, updateSessionMetadata } from '@/lib/brain/sessions'

// OpenRouter API endpoint (OpenAI-compatible)
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function POST(req: NextRequest) {
  try {
    const {
      message,
      history = [],
      model = 'openai/gpt-3.5-turbo',
      projectId,
      sessionId,
      temperature = 0.7,
      maxTokens = 4000,
    } = await req.json()

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check for API key
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'OPENROUTER_API_KEY not configured',
          message: 'Please add OPENROUTER_API_KEY to your .env.local file. Get it from https://openrouter.ai/keys'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create session if not exists
    let currentSessionId = sessionId
    if (!currentSessionId && projectId) {
      const session = createSession(projectId)
      currentSessionId = session.id
    }

    // Build brain context
    let brainContext = ''
    if (projectId && currentSessionId) {
      try {
        brainContext = await buildChatContext(message, currentSessionId, projectId, 2000)
      } catch (error) {
        console.error('Brain context error:', error)
      }
    }

    // Build messages array
    const messages: any[] = [
      {
        role: 'system',
        content: `You are V-AI, a helpful and knowledgeable AI assistant. You are direct, concise, and provide accurate information.
        
${brainContext ? brainContext + '\n\n' : ''}When answering questions about code, use the brain context provided above if available.`
      }
    ]

    // Add history
    for (const msg of history.slice(-10)) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    })

    // Call OpenRouter API with streaming
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'V-AI Assistant',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return new Response(
        JSON.stringify({ error: error.error?.message || 'OpenRouter API error' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Stream the response
    const encoder = new TextEncoder()
    let fullResponse = ''

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader()
        const decoder = new TextDecoder()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                
                if (data === '[DONE]') {
                  // Update session metadata
                  if (currentSessionId) {
                    try {
                      updateSessionMetadata(currentSessionId, {
                        messages_count: history.length + 1,
                        tokens_used: Math.ceil(fullResponse.length / 4),
                      })
                    } catch { /* non-critical */ }
                  }

                  controller.enqueue(encoder.encode(
                    `data: ${JSON.stringify({ done: true, sessionId: currentSessionId })}\n\n`
                  ))
                  continue
                }

                try {
                  const json = JSON.parse(data)
                  const content = json.choices?.[0]?.delta?.content

                  if (content) {
                    fullResponse += content
                    controller.enqueue(encoder.encode(
                      `data: ${JSON.stringify({ token: content })}\n\n`
                    ))
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error)
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error: any) {
    console.error('OpenRouter chat error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
