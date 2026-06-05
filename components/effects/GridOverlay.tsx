'use client'

import { motion } from 'framer-motion'

export default function GridOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Horizontal lines */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`h-${i}`}
          className="absolute w-full h-px bg-gradient-to-r from-transparent via-stark-cyan/20 to-transparent"
          style={{ top: `${(i + 1) * 5}%` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}

      {/* Vertical lines */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`v-${i}`}
          className="absolute h-full w-px bg-gradient-to-b from-transparent via-stark-cyan/20 to-transparent"
          style={{ left: `${(i + 1) * 5}%` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-stark-cyan/50" />
      <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-stark-cyan/50" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-stark-cyan/50" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-stark-cyan/50" />
    </div>
  )
}