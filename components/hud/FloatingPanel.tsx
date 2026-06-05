'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minimize2, Maximize2, GripVertical } from 'lucide-react'

interface FloatingPanelProps {
  title: string
  children: React.ReactNode
  defaultPosition?: { x: number; y: number }
  defaultSize?: { width: number; height: number }
  icon?: React.ReactNode
  onClose?: () => void
}

export default function FloatingPanel({
  title,
  children,
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 400, height: 500 },
  icon,
  onClose,
}: FloatingPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      initial={defaultPosition}
      className={`absolute z-40 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${
        isMaximized ? 'inset-4' : ''
      }`}
      style={
        isMaximized
          ? {}
          : {
              width: defaultSize.width,
              height: isMinimized ? 'auto' : defaultSize.height,
            }
      }
    >
      <motion.div
        layout
        className="glass-strong rounded-lg border border-stark-cyan/30 overflow-hidden shadow-2xl"
        whileHover={{ borderColor: 'rgba(0, 217, 255, 0.5)' }}
      >
        {/* Header */}
        <div className="bg-stark-navy/70 border-b border-stark-cyan/30 px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing">
          <div className="flex items-center space-x-3">
            <GripVertical className="w-4 h-4 text-stark-cyan/50" />
            {icon && <div className="text-stark-cyan">{icon}</div>}
            <h3 className="text-sm font-bold neon-text-blue">{title}</h3>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded hover:bg-stark-cyan/20 text-stark-cyan/70 hover:text-stark-cyan transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 rounded hover:bg-stark-cyan/20 text-stark-cyan/70 hover:text-stark-cyan transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </motion.button>

            {onClose && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1 rounded hover:bg-red-500/20 text-stark-cyan/70 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className={`p-4 ${isMaximized ? 'h-full overflow-y-auto' : ''}`}>
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Grip */}
        {!isMinimized && !isMaximized && (
          <div className="h-2 bg-stark-navy/50 border-t border-stark-cyan/20 cursor-ns-resize" />
        )}
      </motion.div>

      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        animate={{
          boxShadow: [
            '0 0 20px rgba(0, 217, 255, 0.1)',
            '0 0 40px rgba(0, 217, 255, 0.2)',
            '0 0 20px rgba(0, 217, 255, 0.1)',
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