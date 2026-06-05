'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

interface HolographicWindowProps {
  title: string
  children: React.ReactNode
  variant?: 'default' | 'alert' | 'success' | 'warning'
  className?: string
}

export default function HolographicWindow({
  title,
  children,
  variant = 'default',
  className = '',
}: HolographicWindowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const variants = {
    default: {
      border: 'border-stark-cyan',
      glow: '#00D9FF',
      shadow: 'shadow-neon-cyan',
    },
    alert: {
      border: 'border-red-500',
      glow: '#EF4444',
      shadow: 'shadow-neon-orange',
    },
    success: {
      border: 'border-green-500',
      glow: '#10B981',
      shadow: '',
    },
    warning: {
      border: 'border-yellow-500',
      glow: '#F59E0B',
      shadow: '',
    },
  }

  const currentVariant = variants[variant]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    let animationFrame: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Holographic scan line
      const scanY = (Date.now() / 20) % canvas.height
      const gradient = ctx.createLinearGradient(0, scanY - 50, 0, scanY + 50)
      gradient.addColorStop(0, 'transparent')
      gradient.addColorStop(0.5, currentVariant.glow + '40')
      gradient.addColorStop(1, 'transparent')

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => cancelAnimationFrame(animationFrame)
  }, [currentVariant.glow])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotateX: -10 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.9, rotateX: 10 }}
      className={`relative holographic rounded-lg ${currentVariant.border} ${currentVariant.shadow} ${className}`}
      style={{ perspective: 1000 }}
    >
      {/* Holographic Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 rounded-lg pointer-events-none"
      />

      {/* Header */}
      <div className="relative border-b border-current p-4 bg-stark-navy/30">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold tracking-wider" style={{ color: currentVariant.glow }}>
            {title}
          </h3>
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentVariant.glow }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.2,
                  repeat: Infinity,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative p-6 bg-gradient-to-b from-stark-navy/20 to-transparent">
        {children}
      </div>

      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-current" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-current" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-current" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-current" />

      {/* Animated Border */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        animate={{
          boxShadow: [
            `0 0 10px ${currentVariant.glow}40`,
            `0 0 30px ${currentVariant.glow}60`,
            `0 0 10px ${currentVariant.glow}40`,
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  )
}