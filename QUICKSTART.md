# ⚡ JARVIS Quick Start - 2 Minuti

## Passo 1: Ottieni API Key (2 minuti)

### Vai su OpenAI
🔗 https://platform.openai.com/api-keys

1. Fai login (o crea account)
2. Clicca **"Create new secret key"**
3. **Copia la chiave** (inizia con `sk-`)

💡 **Nota:** Ti danno $5 di crediti gratis! Sufficienti per migliaia di messaggi.

---

## Passo 2: Configura (30 secondi)

Apri il terminale in `jarvis-os/` e:

```bash
# Crea il file di configurazione
copy .env.local.example .env.local
```

Apri `.env.local` con un editor di testo e incolla la tua chiave:

```env
OPENAI_API_KEY=sk-la-tua-chiave-appena-copiata
```

Salva e chiudi.

---

## Passo 3: Riavvia (10 secondi)

Nel terminale:

```bash
# Ferma il server (se già attivo)
# Premi: Ctrl + C

# Riavvia
npm run dev
```

---

## ✅ TEST

1. Apri http://localhost:3000
2. Clicca l'icona AI in basso a destra
3. Scrivi: **"write me a hello world in python"**

Se JARVIS ti dà codice Python vero → **FUNZIONA!** 🎉

Se dice ancora risposte generiche → controlla questi punti:
- [ ] Hai riavviato il server dopo aver creato `.env.local`?
- [ ] La chiave API inizia con `sk-`?
- [ ] Hai copiato nel file giusto? (deve essere `.env.local` nella root del progetto)

---

## 🎯 Cosa chiedere a JARVIS

```
"Create a REST API with Express.js and TypeScript"
"Write a React component for a user profile card"
"Optimize this code: [incolla codice]"
"Explain how JWT authentication works"
"Deploy this to Vercel"
"Write unit tests for this function"
```

JARVIS ora risponde con codice vero, spiegazioni dettagliate e soluzioni concrete! 🚀

---

## 💰 Costi

- **GPT-4o-mini**: ~$0.0005 per messaggio (economico!)
- Con $5 di crediti → ~10,000 messaggi
- Sufficiente per mesi di sviluppo

---

## 🆘 Problemi?

### "API key not configured"
```bash
# Verifica che il file esista
dir .env.local

# Se non esiste, ricrea
copy .env.local.example .env.local
```

### "Insufficient quota"
- Hai finito i crediti gratuiti
- Vai su https://platform.openai.com/account/billing
- Aggiungi carta di credito (serve solo per i crediti extra)

### Ancora risposte mock?
```bash
# Cancella la cache di Next.js
rmdir /s /q .next
npm run dev
```

---

**Pronto!** Ora hai un vero AI assistant funzionante! 🎉
