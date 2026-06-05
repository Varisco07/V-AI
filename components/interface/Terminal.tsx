'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Terminal as TerminalIcon, ChevronRight, X } from 'lucide-react'

interface Command {
  input: string
  output: string[]
  timestamp: Date
}

interface TerminalProps {
  onClose?: () => void
}

export default function Terminal({ onClose }: TerminalProps) {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<Command[]>([
    {
      input: 'help',
      output: [
        'V-AI Terminal v1.0.0',
        '',
        'Available commands:',
        '  help      - Show this help',
        '  clear     - Clear terminal',
        '  status    - System status',
        '  projects  - List projects',
        '  analyze   - Code analysis',
        '  deploy    - Deploy application',
        '  info      - System information',
      ],
      timestamp: new Date(),
    },
  ])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [history])

  const executeCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase()
    let output: string[] = []

    switch (trimmedCmd) {
      case 'help':
        output = [
          'Available commands:',
          '  help      - Show this help',
          '  clear     - Clear terminal',
          '  status    - System status',
          '  projects  - List projects',
          '  analyze   - Code analysis',
          '  deploy    - Deploy application',
          '  info      - System information',
        ]
        break

      case 'clear':
        setHistory([])
        return

      case 'status':
        output = [
          'System Status',
          '─────────────────',
          '✓ AI Core:    Online',
          '✓ Network:    Connected',
          '✓ Database:   Healthy',
          `✓ Uptime:     ${Math.floor(Math.random() * 100)}h ${Math.floor(Math.random() * 60)}m`,
          '',
          'All systems operational',
        ]
        break

      case 'projects':
        output = [
          'Active Projects',
          '─────────────────',
          '1. V-AI Platform       [████████░░] 90%',
          '2. Project Alpha       [█████░░░░░] 50%',
          '',
          'Use "cd <project>" to switch',
        ]
        break

      case 'analyze':
        output = [
          'Analyzing environment...',
          '',
          '✓ Code quality:    Excellent',
          '✓ Security:        No issues',
          '✓ Performance:     Optimized',
          '✓ Dependencies:    Up to date',
          '',
          'Analysis complete',
        ]
        break

      case 'deploy':
        output = [
          'Deployment sequence initiated',
          '',
          '[1/5] Building application...',
          '[2/5] Running tests...',
          '[3/5] Optimizing assets...',
          '[4/5] Packaging...',
          '[5/5] Deploying to production...',
          '',
          '✓ Deployment successful!',
        ]
        break

      case 'info':
        output = [
          'V-AI Platform',
          '─────────────────',
          'Version:       1.0.0',
          'Environment:   Development',
          'Node Version:  20.x',
          'Framework:     Next.js 14',
          'AI Model:      Llama 3.2',
        ]
        break

      default:
        output = [
          `Command not found: "${cmd}"`,
          'Type "help" for available commands',
        ]
    }

    setHistory([...history, { input: cmd, output, timestamp: new Date() }])
    setCommandHistory([...commandHistory, cmd])
    setInput('')
    setHistoryIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (input.trim()) executeCommand(input)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput('')
      }
    }
  }

  return (
    <div className="card-glass h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-vari-dark/80 border-b border-vari-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="w-4 h-4 text-vari-primary" />
          <span className="text-sm font-semibold text-vari-light">Terminal</span>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-vari-muted hover:text-vari-error transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="flex-1 p-4 font-mono text-sm overflow-y-auto bg-vari-darker/50"
      >
        {history.map((cmd, idx) => (
          <div key={idx} className="mb-4">
            <div className="flex items-center space-x-2 text-vari-muted">
              <ChevronRight className="w-3.5 h-3.5 text-vari-primary" />
              <span className="text-vari-secondary">vari</span>
              <span>$</span>
              <span className="text-vari-light">{cmd.input}</span>
            </div>
            <div className="mt-2 ml-5 text-vari-light/90 whitespace-pre-wrap">
              {cmd.output.map((line, lineIdx) => (
                <div key={lineIdx}>{line}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Input Line */}
      <div className="border-t border-vari-border bg-vari-dark/50 px-4 py-2.5 flex items-center space-x-2">
        <ChevronRight className="w-3.5 h-3.5 text-vari-primary" />
        <span className="text-vari-secondary font-mono text-sm">vari</span>
        <span className="text-vari-muted font-mono text-sm">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-vari-light font-mono text-sm placeholder-vari-muted/50"
          placeholder="type a command..."
          autoFocus
        />
        <span className="w-2 h-4 bg-vari-primary animate-pulse" />
      </div>
    </div>
  )
}
