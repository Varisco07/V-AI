# Design Document: Persistent AI Memory System (brain.db)

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                        │
├─────────────────────────────────────────────────────────┤
│  ProjectBrain.tsx    AIChat.tsx    SystemMetrics.tsx    │
│  (sidebar)           (center)      (stats)              │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│                    API LAYER                             │
├─────────────────────────────────────────────────────────┤
│  /api/brain/project    /api/brain/index                 │
│  /api/brain/search     /api/brain/graph                 │
│  /api/brain/tasks      /api/brain/bugs                  │
│  /api/brain/decisions                                    │
│                                                          │
│  /api/chat-local  (modified with context injection)     │
│  /api/agent       (modified with context injection)     │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│                  BRAIN LIBRARY LAYER                     │
├─────────────────────────────────────────────────────────┤
│  lib/brain/db.ts         - Database singleton           │
│  lib/brain/projects.ts   - Project CRUD                 │
│  lib/brain/indexer.ts    - File scanning & parsing      │
│  lib/brain/search.ts     - BM25 search engine           │
│  lib/brain/dependency.ts - Dependency graph queries     │
│  lib/brain/knowledge.ts  - Knowledge graph CRUD         │
│  lib/brain/tasks.ts      - Task manager                 │
│  lib/brain/bugs.ts       - Bug tracker                  │
│  lib/brain/decisions.ts  - Decision history             │
│  lib/brain/context.ts    - Context injection builder    │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│                  DATA LAYER                              │
├─────────────────────────────────────────────────────────┤
│  .vari-memory/brain.db   (SQLite with WAL mode)         │
│  .vari-memory/memory.db  (existing, to be integrated)   │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Tables

```sql
-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  root_path TEXT,
  tech_stack TEXT DEFAULT '[]',
  status TEXT DEFAULT 'active',
  meta TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_root_path ON projects(root_path);

-- File index table
CREATE TABLE IF NOT EXISTS project_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  path TEXT NOT NULL,
  content_hash TEXT,
  language TEXT,
  loc INTEGER DEFAULT 0,
  size_bytes INTEGER DEFAULT 0,
  summary TEXT,
  symbols TEXT DEFAULT '[]',
  indexed_at INTEGER,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, path)
);
CREATE INDEX idx_files_project ON project_files(project_id);
CREATE INDEX idx_files_language ON project_files(language);
CREATE INDEX idx_files_hash ON project_files(content_hash);

-- RAG chunks table
CREATE TABLE IF NOT EXISTS rag_chunks (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  tokens INTEGER DEFAULT 0,
  tfidf_terms TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (file_id) REFERENCES project_files(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX idx_chunks_file ON rag_chunks(file_id);
CREATE INDEX idx_chunks_project ON rag_chunks(project_id);

-- FTS5 virtual table for full-text search on chunks
CREATE VIRTUAL TABLE IF NOT EXISTS rag_chunks_fts USING fts5(
  chunk_id UNINDEXED,
  content,
  content=rag_chunks,
  content_rowid=rowid
);

-- Triggers to keep FTS5 in sync
CREATE TRIGGER IF NOT EXISTS rag_chunks_ai AFTER INSERT ON rag_chunks BEGIN
  INSERT INTO rag_chunks_fts(rowid, chunk_id, content) VALUES (new.rowid, new.id, new.content);
END;

CREATE TRIGGER IF NOT EXISTS rag_chunks_ad AFTER DELETE ON rag_chunks BEGIN
  INSERT INTO rag_chunks_fts(rag_chunks_fts, rowid, chunk_id, content) VALUES('delete', old.rowid, old.id, old.content);
END;

CREATE TRIGGER IF NOT EXISTS rag_chunks_au AFTER UPDATE ON rag_chunks BEGIN
  INSERT INTO rag_chunks_fts(rag_chunks_fts, rowid, chunk_id, content) VALUES('delete', old.rowid, old.id, old.content);
  INSERT INTO rag_chunks_fts(rowid, chunk_id, content) VALUES (new.rowid, new.id, new.content);
END;

-- BM25 statistics table
CREATE TABLE IF NOT EXISTS bm25_stats (
  term TEXT PRIMARY KEY,
  doc_freq INTEGER NOT NULL,
  idf REAL NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_bm25_term ON bm25_stats(term);

-- File dependencies table
CREATE TABLE IF NOT EXISTS file_dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  source_file TEXT NOT NULL,
  target_file TEXT NOT NULL,
  dep_type TEXT DEFAULT 'import',
  symbol TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, source_file, target_file, symbol)
);
CREATE INDEX idx_deps_source ON file_dependencies(project_id, source_file);
CREATE INDEX idx_deps_target ON file_dependencies(project_id, target_file);

-- Knowledge graph nodes
CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  line_start INTEGER,
  meta TEXT DEFAULT '{}',
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX idx_nodes_project ON knowledge_nodes(project_id);
CREATE INDEX idx_nodes_type ON knowledge_nodes(type);
CREATE INDEX idx_nodes_name ON knowledge_nodes(name);

-- Knowledge graph edges
CREATE TABLE IF NOT EXISTS knowledge_edges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  from_node TEXT NOT NULL,
  to_node TEXT NOT NULL,
  relation TEXT NOT NULL,
  weight REAL DEFAULT 1.0,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (from_node) REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (to_node) REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  UNIQUE(from_node, to_node, relation)
);
CREATE INDEX idx_edges_from ON knowledge_edges(from_node);
CREATE INDEX idx_edges_to ON knowledge_edges(to_node);
CREATE INDEX idx_edges_relation ON knowledge_edges(relation);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'feature',
  status TEXT DEFAULT 'open',
  priority INTEGER DEFAULT 3,
  assigned_to TEXT DEFAULT 'ai',
  parent_task TEXT,
  related_files TEXT DEFAULT '[]',
  ai_notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- Bugs table
CREATE TABLE IF NOT EXISTS bugs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  file_path TEXT,
  line_number INTEGER,
  error_trace TEXT,
  root_cause TEXT,
  fix_applied TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  fixed_at INTEGER,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX idx_bugs_project ON bugs(project_id);
CREATE INDEX idx_bugs_status ON bugs(status);
CREATE INDEX idx_bugs_severity ON bugs(severity);

-- Decisions table
CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  context TEXT,
  decision TEXT NOT NULL,
  alternatives TEXT DEFAULT '[]',
  impact TEXT,
  decided_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX idx_decisions_project ON decisions(project_id);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  summary TEXT,
  messages_count INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);
CREATE INDEX idx_sessions_project ON sessions(project_id);

-- Session context table
CREATE TABLE IF NOT EXISTS session_context (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  UNIQUE(session_id, key)
);
CREATE INDEX idx_context_session ON session_context(session_id);
```

## Module Design

### lib/brain/db.ts - Database Singleton

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

class BrainDatabase {
  private static instance: Database.Database | null = null;
  private static readonly DB_PATH = '.vari-memory/brain.db';

  static getInstance(): Database.Database {
    if (!this.instance) {
      // Ensure directory exists
      const dir = path.dirname(this.DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Open database with WAL mode
      this.instance = new Database(this.DB_PATH);
      this.instance.pragma('journal_mode = WAL');
      this.instance.pragma('synchronous = NORMAL');
      this.instance.pragma('cache_size = -64000'); // 64MB cache
      this.instance.pragma('foreign_keys = ON');
      
      // Initialize schema
      this.initSchema();
    }
    return this.instance;
  }

  private static initSchema(): void {
    const db = this.instance!;
    
    // Execute all CREATE TABLE statements from schema
    // ... (all SQL from above)
  }

  static close(): void {
    if (this.instance) {
      this.instance.close();
      this.instance = null;
    }
  }
}

export const getDb = () => BrainDatabase.getInstance();
export const closeDb = () => BrainDatabase.close();
```

### lib/brain/projects.ts - Project Management

```typescript
export interface Project {
  id: string;
  name: string;
  description?: string;
  root_path?: string;
  tech_stack: string[];
  status: 'active' | 'archived' | 'paused';
  meta: Record<string, any>;
  created_at: number;
  updated_at: number;
}

export function createProject(data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Project;
export function getProject(id: string): Project | null;
export function getProjectByPath(root_path: string): Project | null;
export function listProjects(status?: string): Project[];
export function updateProject(id: string, data: Partial<Project>): void;
export function deleteProject(id: string): void;
export function getProjectStats(projectId: string): {
  fileCount: number;
  symbolCount: number;
  taskCount: number;
  bugCount: number;
  chunkCount: number;
};
```

### lib/brain/indexer.ts - File Indexing

```typescript
export interface IndexerConfig {
  projectId: string;
  rootPath: string;
  excludePatterns: string[];
  chunkSize: number;
  chunkOverlap: number;
  enableSummaries: boolean;
}

export interface IndexResult {
  filesIndexed: number;
  symbolsFound: number;
  chunksCreated: number;
  dependencies: number;
  timeElapsed: number;
  errors: string[];
}

export class Indexer {
  constructor(config: IndexerConfig);
  
  // Index entire project
  async indexProject(): Promise<IndexResult>;
  
  // Index single file
  async indexFile(filePath: string): Promise<void>;
  
  // Detect language from extension
  private detectLanguage(filePath: string): string;
  
  // Extract symbols (exports)
  private extractSymbols(content: string, language: string): string[];
  
  // Parse dependencies (imports)
  private parseDependencies(content: string, language: string, filePath: string): void;
  
  // Chunk content
  private chunkContent(content: string): string[];
  
  // Generate AI summary
  private async generateSummary(content: string): Promise<string | null>;
  
  // Compute content hash
  private computeHash(content: string): string;
}
```

### lib/brain/search.ts - BM25 Search Engine

```typescript
export interface SearchResult {
  chunkId: string;
  fileId: string;
  filePath: string;
  content: string;
  score: number;
  chunkIndex: number;
}

export interface BM25Config {
  k1: number;  // default 1.5
  b: number;   // default 0.75
}

export class BM25Search {
  private config: BM25Config;
  
  constructor(config?: Partial<BM25Config>);
  
  // Main search function
  search(query: string, projectId: string, topK?: number): SearchResult[];
  
  // Build context string for AI
  buildBrainContext(query: string, projectId: string, maxTokens?: number): string;
  
  // Compute BM25 score
  private computeBM25(termFreq: number, docLength: number, avgDocLength: number, idf: number): number;
  
  // Update IDF statistics
  updateIDFStats(projectId: string): void;
  
  // Tokenize query
  private tokenize(text: string): string[];
}
```

### lib/brain/context.ts - Context Injection

```typescript
export interface BrainContext {
  project?: {
    name: string;
    techStack: string[];
    fileCount: number;
  };
  relevantChunks: SearchResult[];
  activeTasks: Task[];
  sessionContext: Record<string, any>;
  recentDecisions: Decision[];
}

export async function buildChatContext(
  message: string,
  sessionId: string,
  maxTokens?: number
): Promise<string>;

export async function buildAgentContext(
  projectId: string,
  maxTokens?: number
): Promise<string>;

export function formatBrainContext(context: BrainContext): string;
```

## BM25 Algorithm Implementation

```typescript
// BM25 formula:
// score = Σ IDF(qi) * (freq(qi,d) * (k1+1)) / (freq(qi,d) + k1*(1-b+b*|d|/avgdl))
//
// Where:
// - qi: query term i
// - freq(qi,d): frequency of qi in document d
// - |d|: length of document d
// - avgdl: average document length in collection
// - k1: term frequency saturation parameter (default 1.5)
// - b: length normalization parameter (default 0.75)
// - IDF(qi): inverse document frequency = log((N - df + 0.5) / (df + 0.5) + 1)
// - N: total number of documents
// - df: number of documents containing qi

function computeBM25Score(
  termFreq: number,
  docLength: number,
  avgDocLength: number,
  idf: number,
  k1: number = 1.5,
  b: number = 0.75
): number {
  const numerator = termFreq * (k1 + 1);
  const denominator = termFreq + k1 * (1 - b + b * (docLength / avgDocLength));
  return idf * (numerator / denominator);
}

function computeIDF(numDocs: number, docFreq: number): number {
  return Math.log((numDocs - docFreq + 0.5) / (docFreq + 0.5) + 1);
}
```

## Indexing Workflow

```
1. Scan directory
   ├── Walk file tree
   ├── Filter by extensions (.ts, .tsx, .js, .jsx, .py, etc.)
   └── Exclude node_modules, .git, dist, build

2. For each file:
   ├── Read content
   ├── Compute SHA-256 hash
   ├── Check if hash changed
   ├── If changed or new:
   │   ├── Detect language
   │   ├── Extract symbols (regex patterns)
   │   ├── Parse dependencies (import/require)
   │   ├── Chunk content (400 chars, 80 overlap)
   │   ├── Generate AI summary (async)
   │   └── Store in database
   └── Update project_files record

3. After all files processed:
   ├── Compute term frequencies
   ├── Update BM25 IDF statistics
   └── Return indexing stats
```

## Symbol Extraction Patterns

```typescript
const SYMBOL_PATTERNS = {
  typescript: [
    /export\s+(?:const|let|var)\s+(\w+)/g,
    /export\s+function\s+(\w+)/g,
    /export\s+class\s+(\w+)/g,
    /export\s+interface\s+(\w+)/g,
    /export\s+type\s+(\w+)/g,
    /export\s+enum\s+(\w+)/g,
    /export\s+default\s+(?:function\s+)?(\w+)/g,
  ],
  javascript: [
    /export\s+(?:const|let|var)\s+(\w+)/g,
    /export\s+function\s+(\w+)/g,
    /export\s+class\s+(\w+)/g,
    /export\s+default\s+(\w+)/g,
    /module\.exports\s*=\s*\{([^}]+)\}/g,
  ],
  python: [
    /^def\s+(\w+)/gm,
    /^class\s+(\w+)/gm,
  ],
};
```

## Dependency Parsing Patterns

```typescript
const IMPORT_PATTERNS = {
  typescript: [
    /import\s+.*\s+from\s+['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ],
  python: [
    /^import\s+(\w+)/gm,
    /^from\s+([\w.]+)\s+import/gm,
  ],
};
```

## API Endpoints

### /api/brain/project

```typescript
// GET - List all projects
GET /api/brain/project
Response: { projects: Project[] }

// POST - Create project
POST /api/brain/project
Body: { name, description, root_path, tech_stack }
Response: { project: Project }

// GET - Get project by ID
GET /api/brain/project/[id]
Response: { project: Project, stats: ProjectStats }

// PATCH - Update project
PATCH /api/brain/project/[id]
Body: Partial<Project>
Response: { success: boolean }

// DELETE - Delete project
DELETE /api/brain/project/[id]
Response: { success: boolean }
```

### /api/brain/index

```typescript
// POST - Index project
POST /api/brain/index
Body: { projectId, rootPath, options }
Response: { result: IndexResult }

// POST - Index single file
POST /api/brain/index/file
Body: { projectId, filePath }
Response: { success: boolean }

// POST - Reindex changed files
POST /api/brain/index/incremental
Body: { projectId }
Response: { result: IndexResult }
```

### /api/brain/search

```typescript
// POST - Search chunks
POST /api/brain/search
Body: { query, projectId, topK, minScore }
Response: { results: SearchResult[] }

// POST - Build context
POST /api/brain/search/context
Body: { query, projectId, maxTokens }
Response: { context: string, sources: SearchResult[] }
```

### /api/brain/tasks

```typescript
// GET - List tasks
GET /api/brain/tasks?projectId=xxx&status=open&assignedTo=ai
Response: { tasks: Task[] }

// POST - Create task
POST /api/brain/tasks
Body: { projectId, title, description, type, priority }
Response: { task: Task }

// PATCH - Update task
PATCH /api/brain/tasks/[id]
Body: { status, priority, ai_notes }
Response: { success: boolean }
```

## Error Handling Strategy

```typescript
class BrainError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
  }
}

// Error codes:
// - DB_LOCKED: Database locked, retry with backoff
// - FILE_NOT_FOUND: Skip file, continue indexing
// - PARSE_ERROR: Log error, skip file
// - OLLAMA_UNAVAILABLE: Continue without summaries
// - INVALID_PROJECT: Reject request
// - FOREIGN_KEY_VIOLATION: Validate inputs

// Retry logic for DB_LOCKED:
async function withRetry<T>(
  fn: () => T,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return fn();
    } catch (error) {
      if (error.code === 'SQLITE_BUSY' && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Performance Optimizations

1. **Connection Pooling**: Singleton database connection with WAL mode
2. **Batch Processing**: Index files in batches of 50 to prevent memory exhaustion
3. **FTS5 Index**: Use SQLite FTS5 for O(log n) full-text search
4. **Prepared Statements**: Reuse prepared statements for repeated queries
5. **Lazy Summaries**: Generate AI summaries asynchronously in background
6. **IDF Caching**: Precompute and cache IDF statistics
7. **Index Optimization**: Strategic indexes on foreign keys and search fields
8. **Incremental Updates**: Only reindex changed files (hash comparison)

## Migration Strategy

```typescript
// lib/brain/migrate.ts
export async function migrateFromMemoryDb(): Promise<void> {
  // 1. Read from existing .vari-memory/memory.db
  // 2. Transform to brain.db schema
  // 3. Preserve timestamps
  // 4. Log statistics
}

export async function migrateFromLocalStorage(): Promise<void> {
  // 1. Read localStorage keys (fileStore, conversations)
  // 2. Transform to sessions and project_files
  // 3. Deduplicate by checking existing records
  // 4. Log statistics
}
```

## Testing Strategy

### Unit Tests
- Database CRUD operations for each table
- BM25 score calculation with known inputs
- Symbol extraction with sample code
- Dependency parsing with sample imports
- Chunking algorithm edge cases

### Integration Tests
- Full indexing workflow (scan → parse → store)
- Search with known corpus and queries
- Context injection formatting
- API endpoint request/response cycles

### Performance Tests
- Index 1000 files, measure time (target: <60s)
- Search 100k chunks, measure time (target: <200ms)
- Concurrent access (10 reads + 5 writes)

### Error Tests
- Database locked scenarios
- File not found during indexing
- Ollama unavailable
- Invalid project ID
- Circular dependencies
