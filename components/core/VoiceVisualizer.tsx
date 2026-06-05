'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff } from 'lucide-react'

export default function VoiceVisualizer() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    if (!isListening) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bars = 32
    const barWidth = canvas.width / bars
    let dataArray = new Array(bars).fill(0).map(() => Math.random())

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      dataArray = dataArray.map((val, i) => {
        const target = Math.random() * 0.5 + (isListening ? 0.5 : 0)
        return val + (target - val) * 0.1
      })

      dataArray.forEach((value, i) => {
        const height = value * canvas.height * 0.8
        const x = i * barWidth
        const y = (canvas.height - height) / 2

        const gradient = ctx.createLinearGradient(x, y, x, y + height)
        gradient.addColorStop(0, '#00D9FF')
        gradient.addColorStop(0.5, '#0A84FF')
        gradient.addColorStop(1, '#00D9FF')

        ctx.fillStyle = gradient
        ctx.shadowBlur = 10
        ctx.shadowColor = '#00D9FF'
        ctx.fillRect(x, y, barWidth - 2, height)
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isListening])

  const toggleListening = () => {
    setIsListening(!isListening)
    if (!isListening) {
      // Simulate voice recognition
      setTimeout(() => {
        setTranscript('Analyzing voice command...')
        setTimeout(() => {
          setTranscript('Command recognized: "Show system status"')
        }, 1500)
      }, 500)
    } else {
      setTranscript('')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-strong rounded-lg p-6 border border-stark-cyan/30 w-96"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold neon-text-blue">VOICE CONTROL</h3>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleListening}
          className={`w-12 h-12 rounded-full ${
            isListening
              ? 'bg-stark-cyan shadow-neon-cyan'
              : 'bg-stark-navy/50 border-2 border-stark-cyan/30'
          } flex items-center justify-center transition-all`}
        >
          {isListening ? (
            <Mic className="w-6 h-6 text-black" />
          ) : (
            <MicOff className="w-6 h-6 text-stark-cyan" />
          )}
        </motion.button>
      </div>

      <canvas
        ref={canvasRef}
        width={352}
        height={100}
        className="w-full rounded-lg bg-stark-navy/30 mb-4"
      />

      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-stark-navy/50 border border-stark-cyan/20"
        >
          <p className="text-sm text-stark-cyan font-mono">{transcript}</p>
        </motion.div>
      )}

      <div className="mt-4 text-xs text-stark-cyan/50 space-y-1">
        <p>• "Jarvis, show system status"</p>
        <p>• "Jarvis, deploy application"</p>
        <p>• "Jarvis, analyze code"</p>
      </div>
    </motion.div>
  )
}