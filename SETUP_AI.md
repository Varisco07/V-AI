# 🤖 JARVIS AI Setup Guide

## Quick Setup (5 minuti)

### Opzione 1: OpenAI (Consigliata - Più economica)

1. **Ottieni API Key**
   - Vai su: https://platform.openai.com/api-keys
   - Clicca "Create new secret key"
   - Copia la chiave (inizia con `sk-`)

2. **Configura il progetto**
   ```bash
   # Crea il file .env.local
   copy .env.local.example .env.local
   ```

3. **Aggiungi la chiave**
   Apri `.env.local` e incolla:
   ```
   OPENAI_API_KEY=sk-la-tua-chiave-qui
   ```

4. **Riavvia il server**
   ```bash
   # Ctrl+C per fermare, poi:
   npm run dev
   ```

✅ **FATTO!** JARVIS ora usa GPT-4o-mini (veloce ed economico)

---

### Opzione 2: Anthropic Claude (Più potente)

1. **Ottieni API Key**
   - Vai su: https://console.anthropic.com/
   - Crea un account
   - Ottieni la chiave API

2. **Configura**
   ```
   ANTHROPIC_API_KEY=sk-ant-la-tua-chiave-qui
   ```

3. **Cambia endpoint nella chat**
   In `components/interface/AIChat.tsx` line 54:
   ```typescript
   const response = await fetch('/api/chat-claude', {  // Cambia da /api/chat
   ```

---

### Opzione 3: Ollama (GRATIS - Locale)

1. **Installa Ollama**
   - Scarica da: https://ollama.ai/
   - Installa sul tuo PC

2. **Scarica un modello**
   ```bash
   ollama pull llama3.1
   ```

3. **Crea API route locale**
   Nuovo file: `app/api/chat-ollama/route.ts`

   ```typescript
   import { NextRequest, NextResponse } from 'next/server'

   export async function POST(req: NextRequest) {
     const { message } = await req.json()
     
     const response = await fetch('http://localhost:11434/api/generate', {
       method: 'POST',
       body: JSON.stringify({
         model: 'llama3.1',
         prompt: `You are JARVIS. ${message}`,
         stream: false
       })
     })
     
     const data = await response.json()
     return NextResponse.json({ response: data.response })
   }
   ```

4. **Cambia endpoint**
   ```typescript
   fetch('/api/chat-ollama', { ... })
   ```

✅ **100% GRATIS** ma richiede GPU potente

---

## Costi stimati

| Provider | Modello | Costo per 1000 messaggi |
|----------|---------|------------------------|
| OpenAI | GPT-4o-mini | ~$0.50 |
| OpenAI | GPT-4o | ~$5.00 |
| Anthropic | Claude 3.5 Sonnet | ~$3.00 |
| Ollama | Llama 3.1 | **GRATIS** |

---

## Test rapido

Dopo la configurazione, apri JARVIS e scrivi:

```
"Write me a Python function to calculate fibonacci"
```

JARVIS dovrebbe darti codice vero, non risposte generiche! ✨

---

## Troubleshooting

### "API key not configured"
- Verifica che `.env.local` esista
- Verifica che la chiave inizi con `sk-`
- Riavvia il dev server

### "API request failed"
- Verifica di avere crediti nell'account OpenAI/Anthropic
- Controlla la console del browser (F12) per errori dettagliati

### Risposte ancora generiche
- Verifica di aver riavviato il server dopo aver aggiunto `.env.local`
- Controlla che stai usando `/api/chat` e non il vecchio codice

---

## Best Practice

1. **Non committare** `.env.local` su Git (già in .gitignore)
2. **Usa GPT-4o-mini** per sviluppo (economico)
3. **Passa a GPT-4o** solo se serve ragionamento avanzato
4. **Ollama locale** per privacy totale

---

**Domande?** Il sistema è pronto, serve solo una API key! 🚀
