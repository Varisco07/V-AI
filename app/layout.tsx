import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'V-AI - Advanced AI Platform',
  description: 'Your intelligent AI assistant platform with multi-language support and advanced capabilities',
  keywords: ['V-AI', 'AI Assistant', 'Artificial Intelligence', 'Platform', 'Ollama'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="V-AI" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{
          __html: `if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')`
        }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
