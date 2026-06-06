# 🚀 OpenRouter Setup Guide

## Cos'è OpenRouter?

OpenRouter è un servizio che ti dà accesso a **200+ modelli AI** potenti attraverso una singola API:
- **GPT-4 Turbo** (OpenAI)
- **Claude 3 Opus/Sonnet** (Anthropic)
- **Gemini Pro** (Google)
- **Llama 3.1 70B** (Meta)
- E molti altri!

## 🆚 OpenRouter vs Ollama

| Feature | Ollama (Local) | OpenRouter (Cloud) |
|---------|----------------|-------------------|
| **Costo** | Gratuito | Pay-per-use (~$0.001-0.10 per 1K tokens) |
| **Velocità** | Dipende dal tuo PC | Molto veloce (cloud) |
| **Modelli** | Open source (Llama, Mistral) | GPT-4, Claude, Gemini, ecc. |
| **Qualità** | Buona | Eccellente |
| **Privacy** | 100% locale | Dati processati nel cloud |
| **Internet** | Non richiesto | Richiesto |
| **Setup** | Installare Ollama | Solo API key |

## ✨ Quando Usare OpenRouter?

**Usa OpenRouter quando:**
- ✅ Vuoi la massima qualità (GPT-4, Claude)
- ✅ Hai bisogno di ragionamento avanzato
- ✅ Lavori su task complessi
- ✅ Hai budget per API calls
- ✅ Internet è sempre disponibile

**Usa Ollama quando:**
- ✅ Vuoi gratuito e illimitato
- ✅ Privacy è importante (tutto locale)
- ✅ Hai un buon PC/GPU
- ✅ Task semplici/medium
- ✅ Niente connessione internet

## 📝 Setup (3 minuti)

### Step 1: Crea Account OpenRouter

1. Vai su **https://openrouter.ai**
2. Click **"Sign Up"** (puoi usare Google/GitHub)
3. Verifica la tua email

### Step 2: Ottieni API Key

1. Vai su **https://openrouter.ai/keys**
2. Click **"Create Key"**
3. Dai un nome: "V-AI Development"
4. Click **"Create"**
5. **COPIA LA KEY** (mostrata una sola volta!)
   ```
   sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Step 3: Aggiungi Crediti (Opzionale)

OpenRouter ti dà **$1 gratis** per testare!

Per aggiungere crediti:
1. Vai su **https://openrouter.ai/credits**
2. Click **"Add Credits"**
3. Minimo: $5 (dura molto!)

**Costi tipici:**
- GPT-3.5 Turbo: $0.0015 per 1K tokens (~$0.01 per chat)
- GPT-4 Turbo: $0.01 per 1K tokens (~$0.07 per chat)
- Claude 3 Sonnet: $0.003 per 1K tokens (~$0.02 per chat)
- Llama 3.1 70B: $0.0007 per 1K tokens (~$0.005 per chat)

### Step 4: Configura V-AI

1. Apri il progetto N-AI
2. Crea file `.env.local` (se non esiste)
3. Aggiungi:

```env
OPENROUTER_API_KEY=sk-or-v1-tua-api-key-qui
```

4. Riavvia il dev server:
```bash
npm run dev
```

### Step 5: Seleziona OpenRouter

1. Apri V-AI in browser
2. Nell'header, click sul dropdown del modello
3. Click tab **"☁️ Cloud (OpenRouter)"**
4. Scegli un modello:
   - **GPT-4 Turbo** - Migliore per task complessi
   - **Claude 3 Sonnet** - Ottimo per coding
   - **GPT-3.5 Turbo** - Veloce ed economico
5. ✅ Done!

## 🎯 Modelli Disponibili

### 💎 Premium (Migliori)

**GPT-4 Turbo** (`openai/gpt-4-turbo`)
- Migliore per ragionamento complesso
- Eccellente per coding avanzato
- ~$0.01 per 1K tokens
- Context: 128K tokens

**Claude 3 Opus** (`anthropic/claude-3-opus`)
- Migliore per analisi e scrittura
- Ottimo per coding e debug
- ~$0.015 per 1K tokens
- Context: 200K tokens

**Claude 3 Sonnet** (`anthropic/claude-3-sonnet`)
- Bilanciato qualità/prezzo
- Eccellente per coding
- ~$0.003 per 1K tokens
- Context: 200K tokens

### 🏆 Economici ma Buoni

**GPT-3.5 Turbo** (`openai/gpt-3.5-turbo`)
- Veloce e affidabile
- Ottimo per task semplici
- ~$0.0015 per 1K tokens
- Context: 16K tokens

**Llama 3.1 70B** (`meta-llama/llama-3.1-70b-instruct`)
- Open source ma potente
- Buono per coding
- ~$0.0007 per 1K tokens
- Context: 128K tokens

**Gemini Pro** (`google/gemini-pro`)
- Buon bilanciamento
- Gratis con limiti
- Context: 32K tokens

## 💡 Tips per Risparmiare

### 1. Usa il Brain Context
Il Brain inietta automaticamente solo il codice rilevante → meno tokens!

### 2. Scegli il Modello Giusto
- Task semplici → GPT-3.5 Turbo
- Coding → Claude 3 Sonnet
- Task complessi → GPT-4 Turbo

### 3. Limita la History
Nell'API, passa solo le ultime 10 messaggi (già implementato)

### 4. Usa Ollama per Testing
Testa localmente con Ollama, poi usa OpenRouter per produzione

### 5. Monitora i Costi
Check usage: https://openrouter.ai/usage

## 🔄 Switch tra Ollama e OpenRouter

**Molto facile!** Click sul dropdown nell'header:

**Per Ollama (Local):**
```
Click dropdown → "🏠 Local (Ollama)" → Seleziona modello
```

**Per OpenRouter (Cloud):**
```
Click dropdown → "☁️ Cloud (OpenRouter)" → Seleziona modello
```

La scelta viene salvata automaticamente! 💾

## 🧪 Test Rapido

Dopo il setup, prova:

```
Tu: "Scrivi una funzione TypeScript che calcola 
     il fattoriale ricorsivamente"

OpenRouter (GPT-4): [codice perfetto con edge cases]
OpenRouter (Claude): [codice + spiegazione dettagliata]
Ollama (Llama 3.1): [codice buono, meno completo]
```

## 🐛 Troubleshooting

### "OPENROUTER_API_KEY not configured"

**Soluzione:**
1. Verifica che `.env.local` esista
2. Verifica la variabile: `OPENROUTER_API_KEY=sk-or-v1-...`
3. Riavvia il server: `Ctrl+C` → `npm run dev`

### "Invalid API key"

**Soluzione:**
1. Copia di nuovo la key da https://openrouter.ai/keys
2. Assicurati che inizi con `sk-or-v1-`
3. Nessuno spazio prima/dopo nella `.env.local`

### "Insufficient credits"

**Soluzione:**
1. Vai su https://openrouter.ai/credits
2. Aggiungi almeno $5
3. Riprova

### "Model not found"

**Soluzione:**
1. Verifica il nome del modello sia corretto
2. Check lista modelli: https://openrouter.ai/models
3. Alcuni modelli richiedono beta access

### Risposta molto lenta

**Possibili cause:**
- Modello molto grande (es. Claude 3 Opus)
- Prompt molto lungo
- Rate limit (troppi request)

**Soluzione:**
- Usa modelli più veloci (GPT-3.5, Claude Sonnet)
- Riduci history
- Aspetta qualche secondo tra richieste

## 📊 Monitoraggio Costi

### Check Usage
```
https://openrouter.ai/usage
```

Vedrai:
- Requests per modello
- Tokens usati
- Costo totale
- Grafico temporale

### Set Limits
```
https://openrouter.ai/settings
```

Puoi impostare:
- Daily spending limit
- Per-request limit
- Alert via email

## 🔐 Security Best Practices

### ✅ DO:
- Tieni la API key in `.env.local` (non committare!)
- Usa different keys per dev/prod
- Rotate keys regolarmente
- Set spending limits

### ❌ DON'T:
- Non committare `.env.local` su GitHub
- Non condividere la key
- Non usare la key in frontend code
- Non hardcodare la key nel codice

## 🎁 Free Tier

OpenRouter offre:
- ✅ $1 gratis all'inizio
- ✅ Alcuni modelli free (Gemini Pro)
- ✅ Rate limits generosi

**Il $1 gratis ti dà circa:**
- 1000 chat con GPT-3.5 Turbo
- 100 chat con Claude Sonnet
- 15 chat con GPT-4 Turbo

## 🆚 Confronto Pratico

Stesso prompt: "Spiegami il BM25 search algorithm"

**Ollama (Llama 3.1 8B):**
- Tempo: 5-10 secondi
- Qualità: Buona spiegazione base
- Costo: $0 (gratis)

**OpenRouter (GPT-3.5 Turbo):**
- Tempo: 2-3 secondi
- Qualità: Spiegazione dettagliata
- Costo: ~$0.01

**OpenRouter (GPT-4 Turbo):**
- Tempo: 3-5 secondi
- Qualità: Spiegazione completa + esempi + codice
- Costo: ~$0.07

**OpenRouter (Claude 3 Sonnet):**
- Tempo: 2-4 secondi
- Qualità: Spiegazione ottima + context
- Costo: ~$0.02

## 🎉 Ready to Go!

Ora hai:
- ✅ Account OpenRouter
- ✅ API Key configurata
- ✅ Modelli potenti disponibili
- ✅ Switch facile Ollama/OpenRouter

**Test subito:**
1. Click dropdown modelli
2. Scegli "☁️ Cloud (OpenRouter)"
3. Seleziona "GPT-4 Turbo"
4. Chiedi qualcosa di complesso!

**Enjoy your supercharged AI!** 🚀🧠✨

---

**Links Utili:**
- Dashboard: https://openrouter.ai/dashboard
- API Keys: https://openrouter.ai/keys
- Usage: https://openrouter.ai/usage
- Models: https://openrouter.ai/models
- Docs: https://openrouter.ai/docs
