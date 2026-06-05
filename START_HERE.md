# 🚀 JARVIS - Inizia Qui!

## ⚡ Setup Veloce (5 minuti)

### Passo 1: Installa dipendenze
```bash
npm install
```
✅ Già fatto se sei qui!

---

### Passo 2: Scegli il tuo AI (GRATIS o A Pagamento)

#### 🆓 **Opzione A: OLLAMA (Consigliata - GRATIS per sempre)**

**Doppio click su:**
```
install-ollama.bat
```

Oppure manuale:
```bash
# 1. Scarica Ollama
https://ollama.ai/download

# 2. Installa modello
ollama pull llama3.2

# 3. Fatto!
```

📖 **Guida completa:** [SETUP_FREE.md](./SETUP_FREE.md)

---

#### 💳 **Opzione B: OpenAI (A pagamento - ~€3/mese)**

1. API Key: https://platform.openai.com/api-keys
2. Crea file `.env.local`:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```
3. Cambia endpoint in `components/interface/AIChat.tsx`:
   ```typescript
   fetch('/api/chat', { ... })  // line 54
   ```

📖 **Guida dettagliata:** [SETUP_AI.md](./SETUP_AI.md)

---

### Passo 3: Avvia JARVIS
```bash
npm run dev
```

Apri: **http://localhost:3000**

---

## ✅ Test Rapido

1. Clicca l'icona AI (basso destra) 🤖
2. Scrivi: **"write a hello world in python"**
3. Se ricevi codice Python → **FUNZIONA!** 🎉

---

## 📚 File Utili

- **SETUP_FREE.md** - Setup gratuito Ollama (CONSIGLIATO)
- **SETUP_AI.md** - Tutte le opzioni AI disponibili
- **COSTI.md** - Confronto costi (Ollama vs OpenAI vs Claude)
- **QUICKSTART.md** - Setup veloce OpenAI
- **README.md** - Documentazione completa

---

## 🆘 Problemi?

### JARVIS risponde sempre "Understood, Sir..."
→ AI non configurato. Segui Passo 2 sopra.

### "Ollama not responding"
```bash
# Verifica installazione
ollama --version

# Scarica modello
ollama pull llama3.2
```

### OpenAI "API key not configured"
→ Hai creato `.env.local` e riavviato il server?

---

## 🎯 Cosa Chiedere a JARVIS

```
"Create a REST API with Express and TypeScript"
"Write a React component for a todo list"
"Explain how async/await works"
"Optimize this code: [incolla codice]"
"Deploy my app to Vercel"
"Write unit tests for this function"
```

---

## 💰 Quanto Costa?

| Soluzione | Costo | Velocità | Privacy |
|-----------|-------|----------|---------|
| **Ollama** | 🆓 **€0/sempre** | ⚡ Dipende da PC | 🔒 Totale |
| OpenAI | 💳 ~€3/mese | ⚡⚡ Veloce | ☁️ Cloud |
| Claude | 💳 ~€10/mese | ⚡⚡ Veloce | ☁️ Cloud |

📖 **Confronto dettagliato:** [COSTI.md](./COSTI.md)

---

## 🏆 Raccomandazione

**Per la maggior parte degli utenti:**

```
✅ USA OLLAMA (Gratis)
```

Passaggi:
1. `install-ollama.bat` (doppio click)
2. Aspetta download modello
3. `npm run dev`
4. Fatto!

---

**Buon lavoro con JARVIS, Sir!** 🚀
