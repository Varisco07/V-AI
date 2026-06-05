'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Save, Download, Upload, FileCode, Settings } from 'lucide-react'

interface CodeEditorProps {
  defaultCode?: string
  language?: string
  theme?: 'dark' | 'matrix'
}

export default function CodeEditor({
  defaultCode = '// Welcome to JARVIS Code Editor\n\nfunction initialize() {\n  console.log("System initialized");\n}\n\ninitialize();',
  language = 'javascript',
  theme = 'dark',
}: CodeEditorProps) {
  const [code, setCode] = useState(defaultCode)
  const [output, setOutput] = useState<string[]>([])
  const [lineNumbers, setLineNumbers] = useState(
    defaultCode.split('\n').map((_, i) => i + 1)
  )

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value
    setCode(newCode)
    setLineNumbers(newCode.split('\n').map((_, i) => i + 1))
  }

  const runCode = () => {
    setOutput([
      '> Executing code...',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'System initialized',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '✓ Execution completed successfully',
      `Time: ${Math.random().toFixed(3)}ms`,
    ])
  }

  const saveCode = () => {
    setOutput([
      '> Saving code...',
      '✓ Code saved successfully',
      `Location: /projects/${language}/main.${language === 'javascript' ? 'js' : language}`,
    ])
  }

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code.${language === 'javascript' ? 'js' : language}`
    a.click()
  }

  return (
    <div className="glass-strong rounded-lg border border-stark-cyan/30 overflow-hidden h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-stark-navy/70 border-b border-stark-cyan/30 p-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileCode className="w-5 h-5 text-stark-cyan" />
          <span className="text-sm font-bold text-stark-cyan">CODE EDITOR</span>
          <span className="text-xs text-stark-cyan/50 px-2 py-1 rounded bg-stark-navy/50">
            {language.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <ToolbarButton icon={Upload} onClick={() => {}} tooltip="Import" />
          <ToolbarButton icon={Download} onClick={downloadCode} tooltip="Download" />
          <ToolbarButton icon={Save} onClick={saveCode} tooltip="Save" />
          <ToolbarButton icon={Settings} onClick={() => {}} tooltip="Settings" />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={runCode}
            className="px-4 py-2 bg-gradient-to-r from-stark-cyan to-stark-blue rounded-lg flex items-center space-x-2 text-white font-bold shadow-neon-cyan"
          >
            <Play className="w-4 h-4" />
            <span>RUN</span>
          </motion.button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers */}
        <div className="w-12 bg-stark-navy/50 border-r border-stark-cyan/20 p-4 text-right font-mono text-xs text-stark-cyan/50 overflow-hidden">
          {lineNumbers.map((num) => (
            <div key={num} className="leading-6">
              {num}
            </div>
          ))}
        </div>

        {/* Code Input */}
        <textarea
          value={code}
          onChange={handleCodeChange}
          className="flex-1 p-4 bg-transparent text-stark-cyan font-mono text-sm resize-none outline-none leading-6"
          spellCheck={false}
          style={{
            tabSize: 2,
          }}
        />
      </div>

      {/* Output Console */}
      {output.length > 0 && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 200 }}
          className="border-t border-stark-cyan/30 bg-stark-navy/50 overflow-y-auto"
        >
          <div className="p-4 font-mono text-xs space-y-1">
            {output.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`${
                  line.startsWith('>') ? 'text-stark-cyan' :
                  line.startsWith('✓') ? 'text-green-500' :
                  line.startsWith('━') ? 'text-stark-cyan/30' :
                  'text-stark-cyan/70'
                }`}
              >
                {line}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Status Bar */}
      <div className="bg-stark-navy/70 border-t border-stark-cyan/30 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4 text-stark-cyan/70">
          <span>Ln {code.split('\n').length}</span>
          <span>Col {code.length}</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-stark-cyan/70">Ready</span>
        </div>
      </div>
    </div>
  )
}

function ToolbarButton({ icon: Icon, onClick, tooltip }: any) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="p-2 rounded hover:bg-stark-cyan/20 text-stark-cyan/70 hover:text-stark-cyan transition-colors relative group"
    >
      <Icon className="w-4 h-4" />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-stark-navy rounded text-xs text-stark-cyan opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {tooltip}
      </div>
    </motion.button>
  )
}