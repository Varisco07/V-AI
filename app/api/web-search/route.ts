import { NextRequest, NextResponse } from 'next/server'

export interface SearchResult {
  title: string
  snippet: string
  url: string
  source: string
}

// ── Wikipedia API (completely free, no key) ───────────────────────────────────

async function searchWikipedia(query: string, lang = 'it'): Promise<SearchResult[]> {
  const results: SearchResult[] = []

  try {
    // Search for matching articles
    const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=search&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3&format=json&origin=*`
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(6000) })
    if (!searchRes.ok) return results
    const searchData = await searchRes.json()
    const pages = searchData?.query?.search || []

    // Get summaries for each result
    for (const page of pages.slice(0, 2)) {
      try {
        const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.title)}`
        const sumRes = await fetch(summaryUrl, { signal: AbortSignal.timeout(5000) })
        if (!sumRes.ok) continue
        const sumData = await sumRes.json()
        if (sumData.extract) {
          results.push({
            title: sumData.title || page.title,
            snippet: sumData.extract.slice(0, 1200),
            url: sumData.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
            source: 'Wikipedia',
          })
        }
      } catch { /* skip this result */ }
    }
  } catch { /* Wikipedia unavailable */ }

  return results
}

// ── DuckDuckGo Instant Answers API (free, no key) ────────────────────────────

async function searchDDG(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = []
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return results
    const data = await res.json()

    // Main abstract
    if (data.Abstract && data.AbstractText) {
      results.push({
        title: data.Heading || query,
        snippet: data.AbstractText.slice(0, 800),
        url: data.AbstractURL || '',
        source: data.AbstractSource || 'DuckDuckGo',
      })
    }

    // Related topics
    for (const topic of (data.RelatedTopics || []).slice(0, 3)) {
      if (topic.Text && topic.FirstURL) {
        results.push({
          title: topic.Text.split(' - ')[0],
          snippet: topic.Text.slice(0, 400),
          url: topic.FirstURL,
          source: 'DuckDuckGo',
        })
      }
    }
  } catch { /* DDG unavailable */ }
  return results
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { query, language = 'it' } = await req.json()
    if (!query?.trim()) return NextResponse.json({ results: [] })

    const wikiLang = language === 'it' ? 'it' : language === 'es' ? 'es' : language === 'fr' ? 'fr' : language === 'de' ? 'de' : 'en'

    const [wikiResults, ddgResults] = await Promise.all([
      searchWikipedia(query, wikiLang),
      searchDDG(query),
    ])

    // Merge, deduplicate by title
    const seen = new Set<string>()
    const combined: SearchResult[] = []
    for (const r of [...wikiResults, ...ddgResults]) {
      const key = r.title.toLowerCase()
      if (!seen.has(key) && r.snippet.length > 50) {
        seen.add(key)
        combined.push(r)
      }
    }

    return NextResponse.json({ results: combined.slice(0, 5) })
  } catch (err) {
    console.error('web-search error:', err)
    return NextResponse.json({ results: [] })
  }
}
