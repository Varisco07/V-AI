'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RefreshCw, Maximize2, Code2, Eye, ExternalLink } from 'lucide-react'
import { PreviewContent } from '@/lib/previewStore'

interface Props {
  content: PreviewContent
  onClose: () => void
}

export default function PreviewPanel({ content, onClose }: Props) {
  const [view, setView] = useState<'preview' | 'code'>('preview')
  const [key, setKey] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Switch to preview when content has html
  useEffect(() => {
    if (content.html) setView('preview')
    else setView('code')
    setKey(k => k + 1)
  }, [content])

  const openExternal = () => {
    if (!content.html) return
    const blob = new Blob([content.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col rounded-xl overflow-hidden"
      style={{ background: 'var(--vari-card)', border: '1px solid var(--vari-border)' }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b shrink-0"
        style={{ borderColor: 'var(--vari-border)', background: 'rgba(99,102,241,0.04)' }}>

        {/* View toggle */}
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--vari-border)' }}>
          {content.html && (
            <button onClick={() => setView('preview')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-all"
              style={{
                background: view === 'preview' ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: view === 'preview' ? 'var(--vari-primary)' : 'var(--vari-muted)',
              }}>
              <Eye className="w-3 h-3" /> Preview
            </button>
          )}
          {(content.code || content.html) && (
            <button onClick={() => setView('code')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-all"
              style={{
                background: view === 'code' ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: view === 'code' ? 'var(--vari-primary)' : 'var(--vari-muted)',
              }}>
              <Code2 className="w-3 h-3" /> Code
            </button>
          )}
        </div>

        <span className="text-xs font-medium flex-1 truncate" style={{ color: 'var(--vari-light)' }}>
          {content.title}
        </span>

        <div className="flex items-center gap-1">
          {content.html && view === 'preview' && (
            <>
              <button onClick={() => setKey(k => k + 1)} title="Reload"
                className="p-1.5 rounded-md transition-colors"
                style={{ color: 'var(--vari-muted)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--vari-light)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--vari-muted)'}>
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button onClick={openExternal} title="Open in new tab"
                className="p-1.5 rounded-md transition-colors"
                style={{ color: 'var(--vari-muted)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--vari-light)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--vari-muted)'}>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button onClick={onClose} title="Close preview"
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--vari-muted)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--vari-error)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--vari-muted)'}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {view === 'preview' && content.html ? (
            <motion.div key={`preview-${key}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="w-full h-full">
              <iframe
                ref={iframeRef}
                key={key}
                srcDoc={content.html}
                title="Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
                className="w-full h-full border-0"
                style={{ background: '#fff' }}
              />
            </motion.div>
          ) : (
            <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="w-full h-full overflow-auto"
              style={{ background: 'rgba(7,7,15,0.6)' }}>
              <pre className="p-4 text-xs font-mono leading-relaxed"
                style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                <code>{content.code || content.html || ''}</code>
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
