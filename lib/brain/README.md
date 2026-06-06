# Brain System - Persistent AI Memory

Sistema di memoria persistente per N-AI che fornisce consapevolezza del progetto cross-sessione, RAG con BM25, knowledge graph, task management e decision tracking.

## 🚀 Quick Start

### 1. Crea un progetto

```typescript
import { createProject } from '@/lib/brain'

const project = createProject({
  name: 'My Project',
  root_path: '/path/to/project',
  tech_stack: ['Next.js', 'TypeScript', 'Tailwind'],
  status: 'active',
  meta: {},
})
```

### 2. Indicizza il progetto

```typescript
import { Indexer } from '@/lib/brain'

const indexer = new Indexer({
  projectId: project.id,
  rootPath: '/path/to/project',
  excludePatterns: ['node_modules', '.git', 'dist'],
  chunkSize: 400,
  chunkOverlap: 80,
  enableSummaries: false,
})

const result = await indexer.indexProject()
console.log(`Indexed ${result.filesIndexed} files, ${result.chunksCreated} chunks`)
```

### 3. Cerca nel codice con BM25

```typescript
import { BM25Search } from '@/lib/brain'

const search = new BM25Search()
const results = search.search('authentication logic', project.id, 5)

// Build formatted context for AI
const context = search.buildBrainContext('how does auth work?', project.id, 2000)
```

### 4. Crea task per l'AI

```typescript
import { createTask } from '@/lib/brain'

const task = createTask({
  project_id: project.id,
  title: 'Implement user registration',
  description: 'Add email/password registration with validation',
  type: 'feature',
  status: 'open',
  priority: 2,
  assigned_to: 'ai',
  related_files: ['app/api/auth/route.ts'],
})
```

### 5. Usa il context nelle chat

```typescript
import { buildChatContext } from '@/lib/brain'

// In your chat route
const brainContext = await buildChatContext(
  userMessage,
  sessionId,
  projectId,
  1500 // max tokens
)

const prompt = systemPrompt + '\n\n' + brainContext + '\n\n' + userMessage
```

## 📚 Moduli

### Database (`db.ts`)

Singleton connection con WAL mode, schema inizializzato automaticamente.

```typescript
import { getDb, closeDb } from '@/lib/brain'

const db = getDb() // Get singleton instance
// Use db for queries
closeDb() // Clean shutdown
```

### Projects (`projects.ts`)

Gestione progetti con CRUD completo.

```typescript
import { 
  createProject, 
  getProject, 
  listProjects, 
  updateProject, 
  deleteProject,
  getProjectStats 
} from '@/lib/brain'

// List all active projects
const projects = listProjects('active')

// Get project stats
const stats = getProjectStats(projectId)
// { fileCount, symbolCount, taskCount, bugCount, chunkCount, nodeCount }
```

### Indexer (`indexer.ts`)

Scansione file, estrazione simboli, chunking, dependency parsing.

**Supporta:**
- TypeScript, JavaScript, Python, Go, Java, Rust, C/C++
- Export detection (functions, classes, interfaces, types)
- Import/require parsing
- SHA-256 hash per change detection
- Chunking con overlap configurabile
- BM25 IDF statistics

```typescript
const indexer = new Indexer({
  projectId: 'xxx',
  rootPath: '/path',
  excludePatterns: ['node_modules'], // default: node_modules, .git, dist, build, .next
  chunkSize: 400, // default
  chunkOverlap: 80, // default
  enableSummaries: false, // Ollama summaries (slow)
})

await indexer.indexProject() // Full scan
await indexer.indexFile('/path/to/file.ts') // Single file
```

### Search (`search.ts`)

BM25 search engine con FTS5.

**Parametri BM25:**
- `k1`: 1.5 (term frequency saturation)
- `b`: 0.75 (length normalization)

```typescript
import { BM25Search, updateIDFStats } from '@/lib/brain'

const search = new BM25Search({ k1: 1.5, b: 0.75 })

// Search chunks
const results = search.search(
  'authentication middleware',
  projectId,
  5, // topK
  0.1 // minScore
)

// Build AI context
const context = search.buildBrainContext(query, projectId, 2000)

// Update IDF statistics after indexing
updateIDFStats(projectId)
```

### Tasks (`tasks.ts`)

Task manager con priorità e AI assignment.

```typescript
import { createTask, getTasks, getAITasks, updateTask } from '@/lib/brain'

// Get AI-assigned tasks by priority
const aiTasks = getAITasks(projectId, 10)

// Get tasks with filters
const openTasks = getTasks(projectId, {
  status: 'open',
  type: 'feature',
  priority: 2,
})

// Update task
updateTask(taskId, { status: 'in_progress' })
```

### Bugs (`bugs.ts`)

Bug tracker con severity e error traces.

```typescript
import { createBug, getBugs, updateBug } from '@/lib/brain'

const bug = createBug({
  project_id: projectId,
  title: 'Login fails with OAuth',
  severity: 'high',
  status: 'open',
  error_trace: '...',
})

const criticalBugs = getBugs(projectId, { severity: 'critical', status: 'open' })
```

### Decisions (`decisions.ts`)

Architectural decision records (ADR).

```typescript
import { createDecision, getDecisions } from '@/lib/brain'

const decision = createDecision({
  project_id: projectId,
  title: 'Use SQLite for brain storage',
  context: 'Need persistent storage for AI memory',
  decision: 'Chose SQLite with WAL mode for simplicity and performance',
  alternatives: [
    'PostgreSQL - too heavy for local app',
    'JSON files - no querying, no FTS',
  ],
  impact: 'All brain data persists between sessions',
  decided_at: Date.now(),
})
```

### Sessions (`sessions.ts`)

Session management con persistent context.

```typescript
import { 
  createSession, 
  setSessionContext, 
  getSessionContext,
  updateSessionMetadata 
} from '@/lib/brain'

const session = createSession(projectId)

// Store context
setSessionContext(session.id, 'current_file', '/src/auth.ts')
setSessionContext(session.id, 'debug_mode', true)

// Retrieve context
const context = getSessionContext(session.id)
// { current_file: '/src/auth.ts', debug_mode: true }

// Update metadata
updateSessionMetadata(session.id, {
  messages_count: 10,
  tokens_used: 5000,
})
```

### Knowledge Graph (`knowledge.ts`)

Graph database per relazioni tra componenti.

```typescript
import { 
  createNode, 
  createEdge, 
  getConnectedNodes,
  findShortestPath,
  findComponentUsage 
} from '@/lib/brain'

// Create node
const node = createNode({
  project_id: projectId,
  type: 'function',
  name: 'authenticateUser',
  file_path: 'lib/auth.ts',
  line_start: 42,
  meta: {},
})

// Create edge
createEdge({
  project_id: projectId,
  from_node: nodeA.id,
  to_node: nodeB.id,
  relation: 'calls',
  weight: 1.0,
})

// Find connected nodes
const connected = getConnectedNodes(node.id, 2) // depth=2

// Find shortest path
const path = findShortestPath(fromNodeId, toNodeId, 5)

// Find component usage
const usages = findComponentUsage('Button', projectId)
```

### Context (`context.ts`)

Context injection per chat e agent.

```typescript
import { buildChatContext, buildAgentContext } from '@/lib/brain'

// For chat-local
const chatContext = await buildChatContext(
  message,
  sessionId,
  projectId,
  1500 // maxTokens
)

// For agent
const agentContext = await buildAgentContext(projectId, 1000)
```

## 🔌 API Endpoints

### Projects

```
GET    /api/brain/project              - List projects
POST   /api/brain/project              - Create project
GET    /api/brain/project/[id]         - Get project
PATCH  /api/brain/project/[id]         - Update project
DELETE /api/brain/project/[id]         - Delete project
```

### Indexing

```
POST   /api/brain/index                - Index project
POST   /api/brain/index/file           - Index single file
```

### Search

```
POST   /api/brain/search               - Search chunks
```

### Tasks

```
GET    /api/brain/tasks                - List tasks
POST   /api/brain/tasks                - Create task
GET    /api/brain/tasks/[id]           - Get task
PATCH  /api/brain/tasks/[id]           - Update task
DELETE /api/brain/tasks/[id]           - Delete task
```

### Bugs

```
GET    /api/brain/bugs                 - List bugs
POST   /api/brain/bugs                 - Create bug
PATCH  /api/brain/bugs/[id]            - Update bug
DELETE /api/brain/bugs/[id]            - Delete bug
```

### Decisions

```
GET    /api/brain/decisions            - List decisions
POST   /api/brain/decisions            - Create decision
```

### Knowledge Graph

```
GET    /api/brain/graph                - Get nodes by type
POST   /api/brain/graph                - Query graph
```

**Query actions:**
- `findComponentUsage`: Find where a component is used
- `findFunctionCallers`: Find who calls a function
- `findPath`: Find shortest path between nodes
- `exportSubgraph`: Export subgraph as JSON

## 🎨 UI Component

```tsx
import ProjectBrain from '@/components/hud/ProjectBrain'

export default function Layout({ children }) {
  return (
    <>
      <ProjectBrain />
      {children}
    </>
  )
}
```

**Features:**
- Project selector
- Overview with stats
- Index project button
- Task list with create form
- Bug list
- Decision log
- Real-time stats

## 📊 Database Schema

```
projects           - Project metadata
project_files      - File index with hash, symbols, LOC
rag_chunks         - Persistent chunks for RAG
rag_chunks_fts     - FTS5 virtual table for search
bm25_stats         - Precomputed IDF for BM25
file_dependencies  - Import/require relationships
knowledge_nodes    - Functions, classes, components
knowledge_edges    - Relationships between nodes
tasks              - Task tracker
bugs               - Bug tracker
decisions          - Decision history
sessions           - Conversation sessions
session_context    - Key-value context per session
```

## ⚡ Performance

- **Indexing**: 1000 files in <60s (SSD, quad-core)
- **Search**: 100k chunks in <200ms
- **Connection**: Singleton with WAL mode
- **Concurrency**: Multiple readers, single writer
- **FTS5**: O(log n) full-text search

## 🔧 Configuration

Database location: `.vari-memory/brain.db`

**Default excludes:**
- `node_modules`
- `.git`
- `dist`
- `build`
- `.next`
- `coverage`

**Supported languages:**
- `.ts`, `.tsx` - TypeScript
- `.js`, `.jsx` - JavaScript
- `.py` - Python
- `.go` - Go
- `.java` - Java
- `.rs` - Rust
- `.cpp`, `.c`, `.h` - C/C++

## 🐛 Troubleshooting

### Database locked errors

Il brain usa WAL mode per concorrenza. Se ricevi "database is locked":
- Chiudi altre connessioni al database
- Verifica che non ci siano processi zombie

### Search returns no results

1. Verifica che il progetto sia indicizzato: `getProjectStats(projectId)`
2. Controlla che i chunk esistano: `SELECT COUNT(*) FROM rag_chunks WHERE project_id = ?`
3. Rigenera IDF stats: `updateIDFStats(projectId)`

### Indexing is slow

- Disabilita `enableSummaries` (richiede Ollama)
- Aggiungi più pattern a `excludePatterns`
- Riduci `chunkSize` se hai file molto grandi

## 📝 Esempi Completi

### Setup completo per nuovo progetto

```typescript
import { createProject, Indexer, BM25Search, createTask } from '@/lib/brain'

// 1. Create project
const project = createProject({
  name: 'E-Commerce API',
  root_path: '/Users/me/projects/ecommerce-api',
  tech_stack: ['Node.js', 'Express', 'PostgreSQL'],
  status: 'active',
  meta: { repo: 'github.com/me/ecommerce-api' },
})

// 2. Index it
const indexer = new Indexer({
  projectId: project.id,
  rootPath: project.root_path!,
  excludePatterns: ['node_modules', 'dist', 'coverage'],
  chunkSize: 400,
  chunkOverlap: 80,
  enableSummaries: false,
})

const result = await indexer.indexProject()
console.log(`✅ Indexed ${result.filesIndexed} files, ${result.chunksCreated} chunks`)

// 3. Create initial tasks
createTask({
  project_id: project.id,
  title: 'Implement payment webhook',
  description: 'Handle Stripe webhook events for payment confirmation',
  type: 'feature',
  priority: 1,
  assigned_to: 'ai',
  status: 'open',
  related_files: ['src/api/webhooks/stripe.ts'],
})

// 4. Search code
const search = new BM25Search()
const authResults = search.search('authentication middleware', project.id, 5)
console.log(`Found ${authResults.length} relevant chunks`)
```

### Integrate con chat esistente

```typescript
// In your chat route
import { buildChatContext } from '@/lib/brain'

export async function POST(req: NextRequest) {
  const { message, sessionId, projectId } = await req.json()
  
  // Build brain context
  let brainContext = ''
  if (projectId) {
    brainContext = await buildChatContext(message, sessionId, projectId, 1500)
  }
  
  // Add to prompt
  const prompt = `
    ${systemPrompt}
    
    ${brainContext}
    
    User: ${message}
    Assistant:
  `
  
  // Call Ollama with prompt
  // ...
}
```

## 🚧 Roadmap

- [ ] Vector embeddings con `nomic-embed-text`
- [ ] File system watcher per auto-indexing
- [ ] Git integration (log, diff, blame)
- [ ] AST parsing per simboli esatti
- [ ] UI graph visualization con D3.js
- [ ] Export/import brain data
- [ ] Multi-project search
- [ ] Smart code refactoring suggestions

## 📄 License

Part of N-AI project.
