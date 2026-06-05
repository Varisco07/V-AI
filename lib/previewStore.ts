// Shared preview state via custom DOM events

export interface PreviewContent {
  title: string
  html?: string        // rendered in iframe
  code?: string        // shown as syntax-highlighted code
  lang?: string        // code language
}

export function openPreview(content: PreviewContent) {
  window.dispatchEvent(new CustomEvent('vari-preview-open', { detail: content }))
}

export function closePreview() {
  window.dispatchEvent(new Event('vari-preview-close'))
}
