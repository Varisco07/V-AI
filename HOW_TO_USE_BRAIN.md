# 🧠 Come Usare il Brain System

## 📍 Dove Cliccare

### 1️⃣ Avvia l'applicazione
```bash
npm run dev
```

### 2️⃣ Apri il browser
```
http://localhost:3000
```

### 3️⃣ Cerca l'icona BRAIN
**Posizione:** In alto a SINISTRA, appena sotto il logo V-AI

Vedrai un **cerchio viola con l'icona di un cervello** 🧠

**Screenshot posizione:**
```
┌─────────────────────────────────────┐
│ V-AI  Workspace  Terminal           │  <- Header
├─────────────────────────────────────┤
│                                     │
│ 🧠 <- CLICCA QUI!                  │  <- Icona fluttuante a sinistra
│                                     │
│                                     │
│      [Resto dell'interfaccia]       │
│                                     │
└─────────────────────────────────────┘
```

### 4️⃣ Click sull'icona 🧠
Si aprirà un **pannello laterale** con il Brain System!

---

## 🎯 Cosa Vedrai

Dopo il click si aprirà il pannello ProjectBrain con:

### **Header**
- 🧠 **Project Brain** (titolo)
- ❌ (pulsante chiudi)

### **Project Selector**
- Dropdown per selezionare progetto
- ➕ **New Project** button

### **Stats** (3 box)
- 📁 **Files** - Numero di file indicizzati
- ✅ **Tasks** - Numero di task
- 🐛 **Bugs** - Numero di bug

### **Tabs** (6 schede)
1. 🧠 **Overview** - Panoramica progetto
2. 📁 **Files** - Lista file indicizzati
3. ✅ **Tasks** - Task manager
4. 🐛 **Bugs** - Bug tracker
5. 📝 **Decisions** - Decision log
6. 🕸️ **Graph** - Knowledge graph

---

## ✨ Primi Passi

### 1. Crea il tuo primo progetto

**Click:** ➕ **New Project**

**Compila il form:**
- **Project Name:** `N-AI`
- **Tech Stack:** `Next.js, TypeScript, SQLite`

**Click:** **Create**

✅ Il progetto è stato creato!

---

### 2. Indicizza il progetto

**Click:** 🔄 **Index Project** (pulsante viola grande)

**Ti chiederà:** "Enter project root path:"

**Inserisci:** `C:\Users\varis\OneDrive\Desktop\N-AI`

**Aspetta:** ~30-60 secondi (vedrai "Indexing...")

**Risultato:** 
```
Indexed 50 files, 1234 chunks in 34.5s
```

✅ Le stats si aggiorneranno automaticamente!

---

### 3. Crea il tuo primo task

**Click tab:** ✅ **Tasks**

**Click:** ➕ **New Task**

**Compila:**
- **Title:** `Add dark mode to brain panel`
- **Description:** `Implement theme toggle in ProjectBrain component`
- **Type:** `Feature`
- **Priority:** `3 - Medium`

**Click:** **Create**

✅ Il task appare nella lista!

---

### 4. Testa il Context Injection

Ora vai nella **chat principale** (al centro) e prova:

```
Come funziona l'indexer del brain system?
```

🎯 **L'AI userà il codice REALE dal brain per rispondere!**

Vedrai nella risposta riferimenti a:
- `lib/brain/indexer.ts`
- `BM25Search`
- `rag_chunks`
- ecc.

---

## 🎨 Colori e Stile

Il pannello Brain ha:
- **Sfondo:** Nero/viola semi-trasparente
- **Bordo:** Viola luminoso
- **Icona:** 🧠 Viola chiaro
- **Animazione:** Slide-in da sinistra

Quando chiuso, vedrai solo il pulsante fluttuante viola.

---

## 🔍 Esempio Completo

### Scenario: Vuoi che l'AI lavori su un task

**1. Apri Brain Panel** (click 🧠)

**2. Vai su Tasks**

**3. Crea task:**
```
Title: Implement search feature
Description: Add full-text search to the chat history
Type: Feature
Priority: 2 - High
```

**4. Torna alla chat principale**

**5. Scrivi:**
```
Lavora sul prossimo task AI ad alta priorità
```

**6. L'agent:**
- Carica automaticamente il task
- Legge il contesto del progetto
- Marca il task come "in_progress"
- Lavora sull'implementazione
- Marca come "done" quando finisce

---

## 🐛 Troubleshooting

### "Non vedo l'icona 🧠"

**Soluzione:**
1. Assicurati che il dev server sia avviato
2. Ricarica la pagina (F5)
3. Controlla la console per errori

### "Il pannello non si apre"

**Soluzione:**
1. Controlla la console browser (F12)
2. Verifica che ProjectBrain.tsx sia stato importato
3. Riavvia il dev server

### "Non trovo il pulsante Index"

**Soluzione:**
1. Assicurati di aver creato un progetto prima
2. Seleziona il progetto dal dropdown
3. Il pulsante è nel tab "Overview"

### "L'indexing non funziona"

**Soluzione:**
1. Verifica il path sia corretto
2. Usa path assoluti: `C:\Users\...`
3. Non path relativi: `./`
4. Controlla i permessi della cartella

---

## 💡 Tips & Tricks

### Tip 1: Usa i filtri
Nel tab Tasks, puoi filtrare per:
- Status (open, in_progress, done)
- Type (feature, bug, refactor)
- Priority (1-5)

### Tip 2: Priorities
- **1 = Critical** - 🔴 Rosso
- **2 = High** - 🟠 Arancione
- **3 = Medium** - 🟡 Giallo
- **4-5 = Low** - 🔵 Blu

### Tip 3: Search nel codice
Usa la chat per cercare:
```
Dove viene gestito l'upload dei file?
```

Il brain cercherà automaticamente nel codice indicizzato!

### Tip 4: Chiudi/Riapri velocemente
- **Click 🧠:** Apri
- **Click ❌:** Chiudi
- **Shortcut futuro:** `Ctrl+B` (da implementare)

---

## 📊 Stats che vedrai

Dopo l'indexing vedrai:

**Overview Tab:**
- **Files:** ~50+ (tutti i .ts, .tsx, .js, ecc.)
- **Symbols:** ~500+ (export function/class/const)
- **Chunks:** ~1000+ (pezzi di 400 caratteri)
- **Nodes:** ~500+ (knowledge graph)
- **Tasks:** Quelli che crei
- **Bugs:** Quelli che tracki

---

## 🚀 Next Level

Una volta che hai familiarità:

1. **Crea più progetti** per separare i codebase
2. **Usa le Decisions** per tracciare scelte architetturali
3. **Traccia i Bug** quando trovi problemi
4. **Esplora il Graph** (quando implementato) per vedere relazioni

---

## 🎉 Fatto!

Ora sai esattamente **dove cliccare** e **come usare** il Brain System!

**Icona da cercare:** 🧠 (viola, in alto a sinistra)

**Buon Brain-storming!** 🧠✨
