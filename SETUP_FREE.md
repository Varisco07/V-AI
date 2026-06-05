# 🆓 JARVIS Setup GRATIS (Ollama)

## 100% Gratuito - Nessun costo, mai

JARVIS ora usa **Ollama** - un'AI che gira completamente sul tuo PC.

✅ **Nessuna API key**  
✅ **Nessun costo**  
✅ **Nessuna connessione internet necessaria**  
✅ **Privacy totale** (nulla esce dal tuo PC)  
✅ **Illimitato** (usa quanto vuoi)

---

## 📥 Installazione (5 minuti)

### Passo 1: Scarica Ollama

**Windows:**
```
https://ollama.ai/download/windows
```

1. Clicca il link
2. Scarica `OllamaSetup.exe`
3. Installa (Next → Next → Install)
4. Fatto! Si avvia automaticamente in background

**Verifica installazione:**
```bash
ollama --version
```

Se vedi un numero di versione → ✅ Installato correttamente

---

### Passo 2: Scarica il modello AI

Apri il **Prompt dei comandi** (o PowerShell) e:

```bash
ollama pull llama3.2
```

Questo scarica il modello AI (~2GB). 

**Aspetta che finisca** (circa 3-5 minuti a seconda della connessione).

Vedrai:
```
pulling manifest
pulling 8eeb52dfb3bb... 100%
pulling 73b313b5552d... 100%
...
success
```

---

### Passo 3: Riavvia JARVIS

Nel progetto:

```bash
# Ferma il server (Ctrl+C)
# Riavvia
npm run dev
```

---

## ✅ TEST

1. Apri http://localhost:3000
2. Clicca l'icona AI (basso destra)
3. Scrivi: **"write me a hello world in python"**

JARVIS dovrebbe rispondere con codice Python vero! 🎉

---

## 🎯 Modelli disponibili

### Llama 3.2 (1B) - **VELOCISSIMO** ⚡
```bash
ollama pull llama3.2
```
- Dimensione: ~2GB
- Velocità: Istantanea
- Qualità: Buona per la maggior parte dei task

### Llama 3.2 (3B) - **BILANCIATO** ⭐ (Consigliato)
```bash
ollama pull llama3.2:3b
```
- Dimensione: ~3GB
- Velocità: Veloce
- Qualità: Ottima

### Llama 3.1 (8B) - **POTENTE** 🚀
```bash
ollama pull llama3.1:8b
```
- Dimensione: ~8GB
- Velocità: Moderata
- Qualità: Eccellente

### Codellama - **SPECIALIZZATO IN CODICE** 💻
```bash
ollama pull codellama
```
- Dimensione: ~7GB
- Velocità: Moderata
- Qualità: Perfetto per programmazione

---

## 🔄 Cambiare modello

Apri: `app/api/chat-local/route.ts`

Trova questa riga (circa linea 40):
```typescript
model: 'llama3.2',
```

Cambia con:
```typescript
model: 'llama3.2:3b',     // Modello da 3B
model: 'llama3.1:8b',     // Modello da 8B
model: 'codellama',        // Specializzato in codice
```

Salva e riavvia il server.

---

## 🖥️ Requisiti Sistema

| Modello | RAM necessaria | GPU | Velocità |
|---------|----------------|-----|----------|
| llama3.2 (1B) | 4GB | No | ⚡⚡⚡ |
| llama3.2:3b | 6GB | No | ⚡⚡ |
| llama3.1:8b | 8GB | Consigliata | ⚡ |
| codellama | 8GB | Consigliata | ⚡ |

**Hai una GPU NVIDIA?**
Ollama la usa automaticamente → Risposte 10x più veloci!

---

## 🆘 Troubleshooting

### "Ollama not responding"
```bash
# Verifica che Ollama sia attivo
ollama list

# Se non funziona, riavvialo
# Windows: Cerca "Ollama" nel menu Start e clicca
```

### Risposte lente?
1. Usa un modello più piccolo:
   ```bash
   ollama pull llama3.2
   ```
2. Chiudi programmi pesanti
3. Ollama userà la GPU se disponibile

### "Model not found"
```bash
# Scarica il modello
ollama pull llama3.2

# Verifica modelli installati
ollama list
```

### JARVIS non risponde
```bash
# Testa Ollama direttamente
ollama run llama3.2

# Scrivi: "Hello"
# Se risponde → Ollama funziona
# Se non risponde → Reinstalla Ollama
```

---

## 🎮 Comandi Ollama Utili

```bash
# Lista modelli installati
ollama list

# Rimuovi modello (libera spazio)
ollama rm llama3.1:8b

# Testa modello direttamente
ollama run llama3.2

# Vedi modelli disponibili
# Vai su: https://ollama.ai/library
```

---

## 💡 Pro Tips

1. **Per codice:** Usa `codellama`
2. **Per velocità:** Usa `llama3.2` (1B)
3. **Per qualità:** Usa `llama3.1:8b`
4. **Multi-modello:** Puoi installare più modelli e switchare
5. **Aggiornamenti:** Ollama si aggiorna automaticamente

---

## 🚀 Performance

**Con GPU (NVIDIA):**
- Risposta in 1-2 secondi
- Come ChatGPT

**Senza GPU (CPU):**
- Risposta in 5-10 secondi (llama3.2)
- Risposta in 10-30 secondi (llama3.1:8b)
- Comunque utilizzabile!

---

## 🔒 Privacy

✅ **Tutto locale** - I dati non escono dal PC  
✅ **Nessun tracking**  
✅ **Open source**  
✅ **Nessuna registrazione**  

Perfetto per progetti aziendali o codice confidenziale.

---

## ⚖️ Ollama vs OpenAI

| Caratteristica | Ollama | OpenAI |
|----------------|--------|--------|
| **Costo** | 🆓 Gratis | 💰 A pagamento |
| **Privacy** | ✅ Locale | ⚠️ Cloud |
| **Velocità** | ⚡ Dipende da PC | ⚡⚡ Veloce |
| **Qualità** | ⭐⭐⭐⭐ Ottima | ⭐⭐⭐⭐⭐ Eccellente |
| **Internet** | ❌ Non serve | ✅ Necessario |
| **Limiti** | ♾️ Illimitato | 📊 Quota mensile |

---

## 🎉 Fatto!

Ora hai JARVIS con AI vera, completamente gratis, per sempre!

**Domande?** Chiedi a JARVIS stesso! 😉
