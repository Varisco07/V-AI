# 📦 Guida alla Generazione di File con V-AI

## 🎯 Funzionalità

La tua AI ora può **creare file automaticamente** e generare un archivio ZIP scaricabile!

## ✨ Come Funziona

### 1. Chiedi a V-AI di Creare un Progetto

Puoi usare frasi come:
- "Crea una todo app"
- "Build a landing page"
- "Crea un sito web con HTML, CSS e JavaScript"
- "Genera un'app React completa"
- "Fammi un portfolio website"

### 2. V-AI Genera i File

L'AI riconoscerà la richiesta e:
1. Creerà tutti i file necessari (HTML, CSS, JS, ecc.)
2. Li organizzerà con le giuste cartelle
3. Aggiungerà codice completo e funzionante
4. Mostrerà un'anteprima dei file generati

### 3. Scarica lo ZIP

- Vedrai un pannello con tutti i file generati
- Clicca sul pulsante **"Download ZIP"** 
- Lo ZIP verrà scaricato automaticamente
- Estrai lo ZIP e usa i file!

## 🔧 Formato Tecnico

L'AI risponderà con questo formato quando crea file:

\`\`\`files
[
  {
    "path": "index.html",
    "content": "<!DOCTYPE html>..."
  },
  {
    "path": "style.css",
    "content": "body { ... }"
  },
  {
    "path": "script.js",
    "content": "console.log('Hello!');"
  }
]
\`\`\`

## 📝 Esempi di Richieste

### Esempio 1: Todo App
```
User: Crea una todo app completa con HTML, CSS e JavaScript
```

### Esempio 2: Landing Page
```
User: Build a modern landing page for a tech startup
```

### Esempio 3: Portfolio
```
User: Genera un portfolio website con sezione about, progetti e contatti
```

### Esempio 4: Dashboard
```
User: Crea una dashboard admin con grafici e tabelle
```

## 🎨 Features

- ✅ **Supporto multi-file**: HTML, CSS, JS, JSON, e altro
- ✅ **Organizzazione cartelle**: Supporta path come `src/components/Button.js`
- ✅ **Preview integrata**: Vedi i file prima di scaricare
- ✅ **Download ZIP**: Un click e hai tutto
- ✅ **Codice production-ready**: Pronto all'uso
- ✅ **Commenti utili**: Codice ben documentato

## 🚀 Inizia Ora!

1. Avvia il server: `npm run dev`
2. Apri V-AI nell'interfaccia
3. Chiedi di creare qualcosa
4. Scarica e usa! 🎉

## 🆘 Troubleshooting

**L'AI non crea file?**
- Assicurati di chiedere progetti completi, non solo snippet
- Usa frasi come "crea", "genera", "build", "fammi"

**Download non funziona?**
- Controlla che Ollama sia in esecuzione
- Verifica la console del browser per errori

**File mancanti?**
- L'AI potrebbe non aver capito tutti i requisiti
- Sii più specifico nella richiesta

## 💡 Tips

- Più sei specifico, migliori saranno i risultati
- Puoi chiedere modifiche ai file generati
- Puoi rigenerare con nuove specifiche
- L'AI ricorda il contesto della conversazione

---

**Buona creazione! 🚀**
