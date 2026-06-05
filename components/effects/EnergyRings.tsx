'use client'

import { motion } from 'framer-motion'

interface EnergyRingsProps {
  count?: number
  maxRadius?: number
  color?: string
}

export default function EnergyRings({ 
  count = 5, 
  maxRadius = 600,
  color = '#00D9FF'
}: EnergyRingsProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {[...Array(count)].map((_, index) => {
        const delay = index * 0.4
        const radius = ((index + 1) / count) * maxRadius

        return (
          <motion.div
            key={index}
            className="absolute rounded-full"
            style={{
              width: radius * 2,
              height: radius * 2,
              border: `2px solid ${color}`,
              opacity: 0,
            }}
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0, 0.6, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 4,
              delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )
      })}

      {/* Scanning Ring */}
      <motion.div
        className="absolute rounded-full border-2 border-stark-cyan"
        style={{
          width: maxRadius,
          height: maxRadius,
        }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.8, 0.2, 0.8],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, transparent 45%, ${color}20 50%, transparent 55%)`,
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </motion.div>

      {/* Pulse Rings */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`pulse-${i}`}
          className="absolute rounded-full"
          style={{
            width: maxRadius * 0.6,
            height: maxRadius * 0.6,
            border: `1px solid ${color}`,
            boxShadow: `0 0 20px ${color}`,
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            delay: i * 0.7,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}