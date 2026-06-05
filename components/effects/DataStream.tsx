'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface DataStreamProps {
  count?: number
  speed?: number
  opacity?: number
}

export default function DataStream({ 
  count = 8, 
  speed = 3,
  opacity = 0.6 
}: DataStreamProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const streams: Array<{
      x: number
      y: number
      speed: number
      length: number
      characters: string[]
    }> = []

    const characters = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'.split('')

    // Initialize streams
    for (let i = 0; i < count; i++) {
      streams.push({
        x: (canvas.width / count) * i + Math.random() * 50,
        y: Math.random() * canvas.height,
        speed: Math.random() * speed + 1,
        length: Math.random() * 20 + 10,
        characters: Array(30).fill(0).map(() => 
          characters[Math.floor(Math.random() * characters.length)]
        ),
      })
    }

    function animate() {
      if (!ctx || !canvas) return

      // Fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      streams.forEach((stream) => {
        stream.y += stream.speed

        if (stream.y > canvas.height + stream.length * 20) {
          stream.y = -stream.length * 20
          stream.x = (canvas.width / count) * streams.indexOf(stream) + Math.random() * 50
        }

        stream.characters.forEach((char, index) => {
          const y = stream.y - index * 20
          const alpha = 1 - (index / stream.length)

          if (index === 0) {
            // Brightest character at the front
            ctx.fillStyle = `rgba(0, 217, 255, ${alpha})`
            ctx.shadowBlur = 10
            ctx.shadowColor = '#00D9FF'
          } else {
            ctx.fillStyle = `rgba(0, 217, 255, ${alpha * 0.5})`
            ctx.shadowBlur = 5
          }

          ctx.font = '14px monospace'
          ctx.fillText(char, stream.x, y)
        })

        // Randomly change characters
        if (Math.random() > 0.95) {
          const idx = Math.floor(Math.random() * stream.characters.length)
          stream.characters[idx] = characters[Math.floor(Math.random() * characters.length)]
        }
      })

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [count, speed])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity }}
    />
  )
}