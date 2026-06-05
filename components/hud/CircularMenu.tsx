'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Maximize2,
  Terminal as TerminalIcon,
  RefreshCw,
  Menu,
  X,
  Download,
  Cpu
} from 'lucide-react'

interface MenuAction {
  id: string
  icon: any
  label: string
  color: string
  action: () => void
}

interface CircularMenuProps {
  onOpenTerminal?: () => void
}

export default function CircularMenu({ onOpenTerminal }: CircularMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeItem, setActiveItem] = useState<string | null>(null)

  const menuItems: MenuAction[] = [
    { 
      id: 'terminal', 
      icon: TerminalIcon, 
      label: 'Terminal', 
      color: 'stark-cyan',
      action: () => {
        if (onOpenTerminal) onOpenTerminal()
        setIsOpen(false)
      }
    },
    { 
      id: 'fullscreen', 
      icon: Maximize2, 
      label: 'Fullscreen', 
      color: 'stark-cyan',
      action: () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen()
        } else {
          document.exitFullscreen()
        }
        setIsOpen(false)
      }
    },
    { 
      id: 'reload', 
      icon: RefreshCw, 
      label: 'Reload', 
      color: 'stark-blue',
      action: () => window.location.reload()
    },
    { 
      id: 'clear-storage', 
      icon: Download, 
      label: 'Clear Data', 
      color: 'stark-orange',
      action: () => {
        if (confirm('Clear all projects and chat history?')) {
          localStorage.clear()
          window.location.reload()
        }
        setIsOpen(false)
      }
    },
    { 
      id: 'performance', 
      icon: Cpu, 
      label: 'Performance', 
      color: 'stark-cyan',
      action: () => {
        const body = document.body
        const isReduced = body.classList.contains('reduce-motion')
        
        if (isReduced) {
          body.classList.remove('reduce-motion')
          localStorage.removeItem('reduce-motion')
        } else {
          body.classList.add('reduce-motion')
          localStorage.setItem('reduce-motion', 'true')
        }
        
        setIsOpen(false)
        window.location.reload()
      }
    },
  ]

  const radius = 110
  const angleStep = (2 * Math.PI) / menuItems.length

  return (
    <div className="relative">
      {/* Center Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative z-50 w-14 h-14 rounded-full glass-strong border-2 ${
          isOpen ? 'border-stark-cyan shadow-neon-cyan' : 'border-stark-cyan/30'
        } flex items-center justify-center transition-all`}
        title="Quick Actions"
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? (
            <X className="w-5 h-5 text-stark-cyan" />
          ) : (
            <Menu className="w-5 h-5 text-stark-cyan" />
          )}
        </motion.div>
        
        {/* Pulse effect */}
        {isOpen && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-stark-cyan"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Menu Items */}
      <AnimatePresence>
        {isOpen && (
          <>
            {menuItems.map((item, index) => {
              const angle = index * angleStep - Math.PI / 2
              const x = Math.cos(angle) * radius
              const y = Math.sin(angle) * radius

              return (
                <motion.div
                  key={item.id}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{ scale: 1, x, y }}
                  exit={{ scale: 0, x: 0, y: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                    delay: index * 0.05,
                  }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onMouseEnter={() => setActiveItem(item.id)}
                    onMouseLeave={() => setActiveItem(null)}
                    onClick={item.action}
                    className="relative w-12 h-12 rounded-full glass border-2 border-stark-cyan/30 hover:border-stark-cyan flex items-center justify-center transition-all group"
                    title={item.label}
                  >
                    <item.icon className="w-5 h-5 text-stark-cyan/70 group-hover:text-stark-cyan" />
                    
                    {/* Tooltip */}
                    <AnimatePresence>
                      {activeItem === item.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap glass-strong px-3 py-1 rounded-lg border border-stark-cyan/30"
                        >
                          <span className="text-xs text-stark-cyan font-bold">
                            {item.label}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Glow effect */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-stark-cyan/20 blur-md"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                    />
                  </motion.button>
                </motion.div>
              )
            })}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}