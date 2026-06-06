<div align="center">

# ⚡ V-AI — Advanced AI Assistant Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-EC4899?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-10B981?style=for-the-badge)]()

**Una piattaforma AI moderna, veloce e personalizzabile — locale o cloud, gratis o a pagamento.**

[🚀 Quick Start](#-quick-start) · [🤖 Setup AI](#-setup-ai) · [✨ Features](#-features) · [📁 Struttura](#-struttura-del-progetto) · [🗺️ Roadmap](#-roadmap)

</div>

---

## ✨ Features

| Funzionalità | Descrizione |
|---|---|
| 🤖 **AI Multipla** | Supporta Ollama (locale & gratuito), OpenAI GPT-4 e Claude di Anthropic |
| 🌐 **Multi-lingua** | 9 lingue disponibili: IT, EN, ES, FR, DE, PT, RU, ZH, JA |
| 📁 **Upload File** | Analisi di PDF, documenti Word e immagini direttamente in chat |
| 🎤 **Voce** | Input vocale tramite Speech Recognition integrata |
| 📊 **System Monitor** | Metriche CPU e RAM in tempo reale |
| 💼 **Project Manager** | Gestione progetti con persistenza locale |
| 💻 **Terminale** | Interfaccia a riga di comando interattiva integrata |
| 🧠 **Brain DB** | Sistema di memoria persistente per il contesto AI |
| 🎨 **UI Moderna** | Design pulito con animazioni Framer Motion e Three.js |
| ⚡ **Performante** | Ottimizzato con Next.js 14 App Router |

---

## 🚀 Quick Start

### Prerequisiti

- [Node.js](https://nodejs.org/) 18+
- npm oppure yarn

### Installazione

```bash
# 1. Clona il repository
git clone https://github.com/Varisco07/V-AI.git
cd V-AI

# 2. Installa le dipendenze
npm install

# 3. Configura le variabili d'ambiente
cp .env.local.example .env.local

# 4. Avvia il server di sviluppo
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser. 🎉

---

## 🤖 Setup AI

V-AI supporta tre provider AI. Scegli quello più adatto alle tue esigenze:

### Opzione 1 — Ollama (Gratuito & Locale ✅ Consigliato)

Nessun costo, nessuna API key. Gira tutto sul tuo PC.

```bash
# 1. Scarica e installa Ollama
# https://ollama.ai/download
# (oppure usa lo script incluso su Windows: install-ollama.bat)

# 2. Scarica un modello
ollama pull llama3.2

# 3. Avvia V-AI
npm run dev
```

> Ollama espone un server locale sulla porta `11434`. V-AI si connette automaticamente.

---

### Opzione 2 — OpenAI (A pagamento)

```bash
# .env.local
OPENAI_API_KEY=sk-...
```

Ottieni la tua chiave su [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

---

### Opzione 3 — Anthropic Claude (A pagamento)

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

Ottieni la tua chiave su [console.anthropic.com](https://console.anthropic.com/).

---

Per una guida dettagliata ai costi e alle differenze tra i provider, consulta [`COSTI.md`](COSTI.md).

---

## 📁 Struttura del Progetto

```
V-AI/
├── app/
│   ├── api/
│   │   ├── chat-local/        # Endpoint per Ollama
│   │   └── system/metrics/    # Metriche di sistema real-time
│   ├── page.tsx               # Entry point dell'interfaccia
│   └── layout.tsx             # Layout root Next.js
│
├── components/
│   ├── hud/
│   │   ├── CommandCenter.tsx  # Gestione progetti
│   │   └── SystemMetrics.tsx  # Monitor CPU/RAM
│   └── interface/
│       ├── AIChat.tsx         # Interfaccia chat principale
│       └── Terminal.tsx       # Terminale interattivo
│
├── lib/                       # Utilities e helper condivisi
├── public/                    # Asset statici
│
├── .claude/                   # Configurazione Claude Code
├── .kiro/specs/brain-db/      # Specifiche del sistema Brain DB
├── .vari-memory/              # Memoria persistente dell'AI
│
├── .env.local.example         # Template variabili d'ambiente
├── QUICKSTART.md              # Guida rapida
├── SETUP_FREE.md              # Setup con Ollama
├── SETUP_AI.md                # Setup provider cloud
├── BRAIN_SETUP.md             # Configurazione Brain DB
└── OPENROUTER_SETUP.md        # Setup OpenRouter (modelli alternativi)
```

---

## 💻 Comandi del Terminale

Il terminale integrato accetta i seguenti comandi:

| Comando | Descrizione |
|---|---|
| `help` | Mostra tutti i comandi disponibili |
| `status` | Stato del sistema e dei servizi AI |
| `projects` | Lista dei progetti salvati |
| `analyze` | Analisi del codice |
| `deploy` | Avvia il processo di deploy |
| `clear` | Pulisce il terminale |

---

## 🎨 Stack Tecnologico

| Layer | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Linguaggio | TypeScript 5.3 |
| Styling | Tailwind CSS 3.3 |
| Animazioni | Framer Motion 11 + GSAP 3 |
| 3D | Three.js + React Three Fiber |
| State | Zustand |
| Database | better-sqlite3 (Brain DB) |
| AI | Ollama / OpenAI / Anthropic |
| Icons | Lucide React |
| File parsing | pdf-parse, jszip |

---

## ⚙️ Variabili d'Ambiente

Copia `.env.local.example` in `.env.local` e compila i campi necessari:

```env
# Provider AI (almeno uno, oppure usa Ollama senza chiavi)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Ollama (opzionale, default: http://localhost:11434)
OLLAMA_BASE_URL=http://localhost:11434
```

---

## 🚀 Deploy

### Vercel (Consigliato)

```bash
npm install -g vercel
vercel
```

### Docker

```bash
docker build -t v-ai .
docker run -p 3000:3000 v-ai
```

> **Nota:** Per il deploy su server remoto, Ollama non sarà disponibile. Usa OpenAI o Claude come provider.

---

## 🗺️ Roadmap

- [x] UI moderna con animazioni
- [x] Supporto multi-lingua (9 lingue)
- [x] Upload e analisi file (PDF, Word, Immagini)
- [x] Monitoring sistema in tempo reale
- [x] Gestione progetti
- [x] Brain DB — memoria persistente AI
- [ ] Integrazione comandi vocali completa
- [ ] Miglioramenti responsive mobile
- [ ] Sistema di plugin
- [ ] Sincronizzazione cloud

---

## 🤝 Contribuire

I contributi sono benvenuti! Per proporre modifiche:

1. Fai un fork del repository
2. Crea un branch (`git checkout -b feature/nuova-feature`)
3. Committa le modifiche (`git commit -m 'feat: aggiungi nuova feature'`)
4. Pusha il branch (`git push origin feature/nuova-feature`)
5. Apri una Pull Request

---

## 📄 Licenza

Questo progetto è distribuito sotto licenza **MIT** — libero per uso personale e commerciale.

---

<div align="center">

Realizzato con ❤️ da [Varisco07](https://github.com/Varisco07)

*"The future is already here — it's just not evenly distributed."*

</div>
