import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'V-AI - Advanced AI Platform',
  description: 'Your intelligent AI assistant platform with multi-language support and advanced capabilities',
  keywords: ['V-AI', 'AI Assistant', 'Artificial Intelligence', 'Platform', 'Ollama'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}