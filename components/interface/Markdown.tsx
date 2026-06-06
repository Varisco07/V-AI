'use client'

import { useState, useCallback } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'

// ── Inline formatter ──────────────────────────────────────────────────────────

function Inline({ text }: { text: string }): React.ReactElement {
  // Tokenize: **bold**, *italic*, ~~strike~~, `code`, [link](url)
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|`[^`]+`|\[[^\]]+\]\([^)]+\))/g)
  return (
    <>
      {tokens.map((t, i) => {
        if (t.startsWith('**') && t.endsWith('**'))
          return <strong key={i} className="font-semibold" style={{ color: 'var(--vari-light)' }}>{t.slice(2, -2)}</strong>
        if (t.startsWith('*') && t.endsWith('*') && !t.startsWith('**'))
          return <em key={i} className="italic" style={{ color: 'var(--vari-light)' }}>{t.slice(1, -1)}</em>
        if (t.startsWith('~~') && t.endsWith('~~'))
          return <del key={i} style={{ color: 'var(--vari-muted)' }}>{t.slice(2, -2)}</del>
        if (t.startsWith('`') && t.endsWith('`'))
          return (
            <code key={i} className="px-1.5 py-0.5 rounded text-[11px] font-mono"
              style={{ background: 'rgba(99,102,241,0.18)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
              {t.slice(1, -1)}
            </code>
          )
        // [label](url)
        const linkMatch = t.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (linkMatch)
          return (
            <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 underline underline-offset-2 transition-opacity hover:opacity-70"
              style={{ color: 'var(--vari-accent)' }}>
              {linkMatch[1]}
              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </a>
          )
        return <span key={i}>{t}</span>
      })}
    </>
  )
}

// ── Code block ────────────────────────────────────────────────────────────────

const LANG_COLORS: Record<string, string> = {
  js: '#f7df1e', ts: '#3178c6', tsx: '#61dafb', jsx: '#61dafb',
  python: '#3572A5', py: '#3572A5', rust: '#dea584', go: '#00ADD8',
  css: '#563d7c', html: '#e34c26', json: '#292929', bash: '#4EAA25',
  sh: '#4EAA25', sql: '#e38c00', md: '#083fa1',
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [code])

  const color = LANG_COLORS[lang.toLowerCase()] || 'var(--vari-muted)'
  const lines = code.split('\n')

  return (
    <div className="my-3 rounded-xl overflow-hidden text-xs"
      style={{ border: '1px solid var(--vari-border)', background: 'rgba(7,7,15,0.7)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2"
        style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--vari-border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}88` }} />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
            {lang || 'code'}
          </span>
          <span className="text-[9px]" style={{ color: 'var(--vari-muted)' }}>
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </span>
        </div>
        <button onClick={copy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-all"
          style={{
            background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
            color: copied ? '#22c55e' : 'var(--vari-muted)',
            border: `1px solid ${copied ? 'rgba(34,197,94,0.25)' : 'transparent'}`,
          }}>
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copiato!' : 'Copia'}
        </button>
      </div>

      {/* Code with line numbers */}
      <div className="flex overflow-x-auto">
        {/* Line numbers */}
        <div className="select-none shrink-0 px-3 py-4 text-right"
          style={{ borderRight: '1px solid rgba(255,255,255,0.05)', minWidth: '2.5rem' }}>
          {lines.map((_, i) => (
            <div key={i} className="leading-6 text-[10px] font-mono" style={{ color: 'rgba(107,107,138,0.5)' }}>
              {i + 1}
            </div>
          ))}
        </div>
        {/* Code */}
        <pre className="flex-1 px-4 py-4 overflow-x-auto font-mono text-[12px] leading-6"
          style={{ color: '#e2e8f0', margin: 0 }}>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────

function Table({ rows }: { rows: string[][] }) {
  if (rows.length < 2) return null
  const [header, , ...body] = rows
  return (
    <div className="my-3 rounded-xl overflow-hidden text-xs"
      style={{ border: '1px solid var(--vari-border)' }}>
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ background: 'rgba(99,102,241,0.08)' }}>
            {header.map((cell, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-semibold text-[11px]"
                style={{ color: 'var(--vari-primary)', borderBottom: '1px solid var(--vari-border)' }}>
                <Inline text={cell.trim()} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-[11px]"
                  style={{ color: 'var(--vari-light)', borderBottom: i < body.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <Inline text={cell.trim()} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main renderer ─────────────────────────────────────────────────────────────

export function renderMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const lines = text.split('\n')
  let i = 0
  let key = 0
  const k = () => key++

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // ── Fenced code block ──────────────────────────────────────────────────
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      // Remove trailing empty line inside block
      while (codeLines.length && codeLines[codeLines.length - 1].trim() === '') codeLines.pop()
      nodes.push(<CodeBlock key={k()} code={codeLines.join('\n')} lang={lang} />)
      i++
      continue
    }

    // ── Table (|col|col|) ──────────────────────────────────────────────────
    if (/^\|.+\|$/.test(trimmed)) {
      const tableRows: string[][] = []
      while (i < lines.length && /^\|.+\|$/.test(lines[i].trim())) {
        tableRows.push(lines[i].trim().split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1))
        i++
      }
      nodes.push(<Table key={k()} rows={tableRows} />)
      continue
    }

    // ── Blockquote ─────────────────────────────────────────────────────────
    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2))
        i++
      }
      nodes.push(
        <div key={k()} className="my-2 pl-4 py-0.5"
          style={{ borderLeft: '3px solid var(--vari-primary)', background: 'rgba(99,102,241,0.05)', borderRadius: '0 6px 6px 0' }}>
          {quoteLines.map((ql, qi) => (
            <p key={qi} className="text-sm leading-relaxed py-0.5" style={{ color: 'var(--vari-muted)' }}>
              <Inline text={ql} />
            </p>
          ))}
        </div>
      )
      continue
    }

    // ── Heading ────────────────────────────────────────────────────────────
    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^(#+)/)?.[1].length || 1
      const content = line.replace(/^#+\s/, '')
      const styles: Record<number, { cls: string; border?: boolean }> = {
        1: { cls: 'text-lg font-bold mt-4 mb-2', border: true },
        2: { cls: 'text-base font-bold mt-3 mb-1.5', border: true },
        3: { cls: 'text-sm font-semibold mt-2.5 mb-1' },
        4: { cls: 'text-sm font-semibold mt-2 mb-0.5' },
        5: { cls: 'text-xs font-semibold mt-1.5 mb-0.5' },
        6: { cls: 'text-xs font-semibold mt-1 mb-0.5' },
      }
      const s = styles[level] || styles[6]
      nodes.push(
        <div key={k()} className={s.cls}
          style={{
            color: 'var(--vari-light)',
            ...(s.border ? { borderBottom: '1px solid var(--vari-border)', paddingBottom: '6px' } : {}),
          }}>
          <Inline text={content} />
        </div>
      )
      i++
      continue
    }

    // ── Task list ──────────────────────────────────────────────────────────
    if (/^[-*]\s\[[ xX]\]/.test(trimmed)) {
      const items: { done: boolean; text: string }[] = []
      while (i < lines.length && /^[-*]\s\[[ xX]\]/.test(lines[i].trim())) {
        const m = lines[i].trim().match(/^[-*]\s\[([ xX])\]\s(.+)$/)
        if (m) items.push({ done: m[1] !== ' ', text: m[2] })
        i++
      }
      nodes.push(
        <ul key={k()} className="my-1.5 space-y-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm">
              <div className="w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center"
                style={{
                  background: item.done ? 'rgba(99,102,241,0.2)' : 'transparent',
                  border: `1.5px solid ${item.done ? 'var(--vari-primary)' : 'var(--vari-border)'}`,
                }}>
                {item.done && <Check className="w-2.5 h-2.5" style={{ color: 'var(--vari-primary)' }} />}
              </div>
              <span style={{ color: item.done ? 'var(--vari-muted)' : 'var(--vari-light)', textDecoration: item.done ? 'line-through' : 'none' }}>
                <Inline text={item.text} />
              </span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // ── Unordered list ─────────────────────────────────────────────────────
    if (/^[-*+]\s/.test(trimmed)) {
      const items: { text: string; indent: number }[] = []
      while (i < lines.length && /^(\s*)[-*+]\s/.test(lines[i])) {
        const m = lines[i].match(/^(\s*)[-*+]\s(.+)$/)
        if (m) items.push({ indent: m[1].length, text: m[2] })
        i++
      }
      nodes.push(
        <ul key={k()} className="my-1.5 space-y-0.5">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2 text-sm" style={{ paddingLeft: `${item.indent * 12}px` }}>
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: item.indent > 0 ? 'var(--vari-muted)' : 'var(--vari-primary)' }} />
              <span style={{ color: 'var(--vari-light)' }}><Inline text={item.text} /></span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // ── Ordered list ───────────────────────────────────────────────────────
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''))
        i++
      }
      nodes.push(
        <ol key={k()} className="my-1.5 space-y-0.5 list-none">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2 text-sm">
              <span className="font-mono text-[11px] font-bold shrink-0 mt-0.5 w-5 text-right"
                style={{ color: 'var(--vari-primary)' }}>{j + 1}.</span>
              <span style={{ color: 'var(--vari-light)' }}><Inline text={item} /></span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    // ── Horizontal rule ────────────────────────────────────────────────────
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      nodes.push(
        <div key={k()} className="my-3 flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'var(--vari-border)' }} />
          <div className="w-1 h-1 rounded-full" style={{ background: 'var(--vari-muted)' }} />
          <div className="flex-1 h-px" style={{ background: 'var(--vari-border)' }} />
        </div>
      )
      i++
      continue
    }

    // ── Image ──────────────────────────────────────────────────────────────
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imgMatch) {
      nodes.push(
        <img key={k()} src={imgMatch[2]} alt={imgMatch[1]}
          className="rounded-xl max-w-full my-3"
          style={{ maxHeight: 480, border: '1px solid var(--vari-border)' }} />
      )
      i++
      continue
    }

    // ── Empty line ─────────────────────────────────────────────────────────
    if (trimmed === '') {
      nodes.push(<div key={k()} className="h-1" />)
      i++
      continue
    }

    // ── Paragraph ──────────────────────────────────────────────────────────
    nodes.push(
      <p key={k()} className="text-sm leading-relaxed" style={{ color: 'var(--vari-light)' }}>
        <Inline text={line} />
      </p>
    )
    i++
  }

  return nodes
}
