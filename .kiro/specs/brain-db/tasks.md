# Tasks: Persistent AI Memory System (brain.db)

## FASE 1: Foundation (brain.db + indexer)

### Task 1.1: Create Database Module ✅🔲⏭️
**Requirement:** Requirement 1 - Database Foundation and Initialization  
**Description:** Create lib/brain/db.ts with singleton database connection, WAL mode, and schema initialization  
**Files to modify:**
- CREATE lib/brain/db.ts

**Acceptance Criteria:**
- Database file created at `.vari-memory/brain.db`
- WAL mode enabled
- All 11 tables created with proper indexes
- FTS5 virtual table for rag_chunks
- Singleton connection pattern implemented
- Foreign keys enabled

### Task 1.2: Implement Project Management ✅🔲⏭️
**Requirement:** Requirement 2 - Project Management  
**Description:** Create lib/brain/projects.ts with CRUD operations for projects  
**Files to modify:**
- CREATE lib/brain/projects.ts

**Acceptance Criteria:**
- createProject() function with UUID generation
- getProject() and getProjectByPath() functions
- listProjects() with status filtering
- updateProject() and deleteProject() with cascade
- getProjectStats() returning counts
- All functions use prepared statements

### Task 1.3: Implement File Indexer Core ✅🔲⏭️
**Requirement:** Requirement 3 - File Indexing and Metadata Extraction  
**Description:** Create lib/brain/indexer.ts with file scanning and metadata extraction  
**Files to modify:**
- CREATE lib/brain/indexer.ts

**Acceptance Criteria:**
- Indexer class with config (excludePatterns, chunkSize, etc.)
- indexProject() scans directory recursively
- Excludes node_modules, .git, dist, build
- detectLanguage() by file extension
- extractSymbols() with regex patterns for TS/JS/Python
- computeHash() using SHA-256
- Stores file metadata in project_files table
- Returns IndexResult with statistics

### Task 1.4: Implement Dependency Parser ✅🔲⏭️
**Requirement:** Requirement 4 - Dependency Parsing and Relationship Tracking  
**Description:** Add dependency parsing to indexer  
**Files to modify:**
- MODIFY lib/brain/indexer.ts
- CREATE lib/brain/dependency.ts

**Acceptance Criteria:**
- parseDependencies() extracts import/require statements
- Resolves relative paths to absolute
- Stores in file_dependencies table
- Detects circular dependencies with warnings
- getDependencies() and getReverseDependencies() functions
- Works for TypeScript, JavaScript, Python

### Task 1.5: Implement RAG Chunking ✅🔲⏭️
**Requirement:** Requirement 5 - Persistent RAG with BM25 Search  
**Description:** Add chunking to indexer and store in database  
**Files to modify:**
- MODIFY lib/brain/indexer.ts

**Acceptance Criteria:**
- chunkContent() creates 400-char chunks with 80-char overlap
- Each chunk stored in rag_chunks table with UUID
- Chunk metadata: file_id, chunk_index, tokens
- FTS5 virtual table automatically updated via triggers
- Extract top 20 terms with frequencies per chunk

### Task 1.6: Implement BM25 Search Engine ✅🔲⏭️
**Requirement:** Requirement 5 - Persistent RAG with BM25 Search  
**Description:** Create lib/brain/search.ts with BM25 algorithm  
**Files to modify:**
- CREATE lib/brain/search.ts

**Acceptance Criteria:**
- BM25Search class with k1=1.5, b=0.75
- search() uses FTS5 MATCH for initial filtering
- computeBM25() implements correct formula
- updateIDFStats() computes and stores IDF values
- Returns top-K results ranked by score
- buildBrainContext() formats results for AI prompt
- Search completes in <200ms for 100k chunks

### Task 1.7: Add AI File Summarization ✅🔲⏭️
**Requirement:** Requirement 6 - File Summarization  
**Description:** Add Ollama integration for file summaries  
**Files to modify:**
- MODIFY lib/brain/indexer.ts

**Acceptance Criteria:**
- generateSummary() calls Ollama asynchronously
- Uses prompt: "Summarize this code file in 1-2 sentences..."
- Stores in project_files.summary
- Rate limited to 5 concurrent requests
- Continues without blocking if Ollama unavailable
- Retry once after 2 seconds on failure

## FASE 2: Project Management APIs

### Task 2.1: Create Project API Routes ✅🔲⏭️
**Requirement:** Requirement 2 - Project Management  
**Description:** Create API routes for project CRUD  
**Files to modify:**
- CREATE app/api/brain/project/route.ts
- CREATE app/api/brain/project/[id]/route.ts

**Acceptance Criteria:**
- GET /api/brain/project - list all projects
- POST /api/brain/project - create project
- GET /api/brain/project/[id] - get project with stats
- PATCH /api/brain/project/[id] - update project
- DELETE /api/brain/project/[id] - delete project
- All routes return proper error codes
- Validate inputs before database writes

### Task 2.2: Create Indexing API Routes ✅🔲⏭️
**Requirement:** Requirement 3 - File Indexing and Metadata Extraction  
**Description:** Create API routes for indexing operations  
**Files to modify:**
- CREATE app/api/brain/index/route.ts
- CREATE app/api/brain/index/file/route.ts

**Acceptance Criteria:**
- POST /api/brain/index - full project indexing
- POST /api/brain/index/file - single file indexing
- POST /api/brain/index/incremental - reindex changed files
- Returns IndexResult with statistics
- Handles errors gracefully
- Supports uploading ZIP files

### Task 2.3: Create Search API Routes ✅🔲⏭️
**Requirement:** Requirement 5 - Persistent RAG with BM25 Search  
**Description:** Create API routes for search operations  
**Files to modify:**
- CREATE app/api/brain/search/route.ts
- CREATE app/api/brain/search/context/route.ts

**Acceptance Criteria:**
- POST /api/brain/search - search chunks
- POST /api/brain/search/context - build AI context
- Accepts query, projectId, topK, minScore
- Returns ranked results with file metadata
- Limits context to specified token budget

### Task 2.4: Implement Task Manager ✅🔲⏭️
**Requirement:** Requirement 8 - Task Management  
**Description:** Create lib/brain/tasks.ts and API routes  
**Files to modify:**
- CREATE lib/brain/tasks.ts
- CREATE app/api/brain/tasks/route.ts
- CREATE app/api/brain/tasks/[id]/route.ts

**Acceptance Criteria:**
- createTask(), updateTask(), deleteTask() functions
- getTasks() with filtering by status, priority, assigned_to
- getAITasks() returns AI-assigned tasks by priority
- FTS5 search on title and description
- API routes for CRUD operations
- Update completed_at when status=done

### Task 2.5: Implement Bug Tracker ✅🔲⏭️
**Requirement:** Requirement 9 - Bug Tracking  
**Description:** Create lib/brain/bugs.ts and API routes  
**Files to modify:**
- CREATE lib/brain/bugs.ts
- CREATE app/api/brain/bugs/route.ts
- CREATE app/api/brain/bugs/[id]/route.ts

**Acceptance Criteria:**
- createBug(), updateBug(), deleteBug() functions
- getBugs() with filtering by severity and status
- Parse error_trace to link related files
- Require fix_description when status=fixed
- API routes for CRUD operations
- Set fixed_at timestamp when fixed

### Task 2.6: Implement Decision History ✅🔲⏭️
**Requirement:** Requirement 10 - Decision History Tracking  
**Description:** Create lib/brain/decisions.ts and API routes  
**Files to modify:**
- CREATE lib/brain/decisions.ts
- CREATE app/api/brain/decisions/route.ts
- CREATE app/api/brain/decisions/[id]/route.ts

**Acceptance Criteria:**
- createDecision(), updateDecision() functions
- getDecisions() with filtering
- Store alternatives as JSON array
- Link to superseding decision when superseded
- API routes for CRUD operations
- Full-text search on title and context

## FASE 3: Context Injection

### Task 3.1: Implement Session Management ✅🔲⏭️
**Requirement:** Requirement 11 - Session Management and Persistent Context  
**Description:** Create lib/brain/sessions.ts for session handling  
**Files to modify:**
- CREATE lib/brain/sessions.ts

**Acceptance Criteria:**
- createSession() linked to project
- setSessionContext() for key-value pairs (upsert)
- getSessionContext() returns all context as object
- updateSessionMetadata() for message_count, tokens_used
- Auto-archive sessions inactive 30+ days
- Track last_activity_at timestamp

### Task 3.2: Implement Context Builder ✅🔲⏭️
**Requirement:** Requirement 12 - Context Injection for chat-local  
**Description:** Create lib/brain/context.ts with context building functions  
**Files to modify:**
- CREATE lib/brain/context.ts

**Acceptance Criteria:**
- buildChatContext(message, sessionId, maxTokens)
- buildAgentContext(projectId, maxTokens)
- formatBrainContext() creates formatted string
- Includes: project info, RAG chunks, session context, tasks
- Respects token budget
- Returns empty string if no project active

### Task 3.3: Integrate Context into chat-local ✅🔲⏭️
**Requirement:** Requirement 12 - Context Injection for chat-local  
**Description:** Modify chat-local route to inject brain context  
**Files to modify:**
- MODIFY app/api/chat-local/route.ts

**Acceptance Criteria:**
- Call buildChatContext() for each message
- Prepend brain context to Ollama prompt
- Limit to 2000 tokens max
- Skip if no active project
- Update session metadata after response
- Handle errors gracefully

### Task 3.4: Integrate Context into agent ✅🔲⏭️
**Requirement:** Requirement 13 - Context Injection for agent  
**Description:** Modify agent route to inject project context  
**Files to modify:**
- MODIFY app/api/agent/route.ts

**Acceptance Criteria:**
- Call buildAgentContext() before planning
- Inject after base prompt, before user message
- Include project stats and top 3 AI tasks
- Update task status when agent starts/completes tasks
- Handle no active project gracefully

## FASE 4: UI Components

### Task 4.1: Create ProjectBrain Component ✅🔲⏭️
**Requirement:** Requirement 14 - ProjectBrain UI Component  
**Description:** Create components/hud/ProjectBrain.tsx  
**Files to modify:**
- CREATE components/hud/ProjectBrain.tsx

**Acceptance Criteria:**
- Display active project name and status
- Show project statistics (files, symbols, tasks, bugs)
- Tabs for: Files, Tasks, Bugs, Decisions, Knowledge Graph
- Searchable file list with language icons
- Task list with status badges and priority
- Forms to create tasks and bugs
- Decision log with expandable details
- "Reindex Project" button

### Task 4.2: Create File Browser Tab ✅🔲⏭️
**Requirement:** Requirement 14 - ProjectBrain UI Component  
**Description:** Implement file list view in ProjectBrain  
**Files to modify:**
- MODIFY components/hud/ProjectBrain.tsx
- CREATE components/hud/FileList.tsx

**Acceptance Criteria:**
- Display files from project_files table
- Show language icon, path, LOC, summary
- Search filter for file paths
- Sort by path, language, or LOC
- Click to view file details
- Hover to see full summary tooltip

### Task 4.3: Create Task Manager Tab ✅🔲⏭️
**Requirement:** Requirement 14 - ProjectBrain UI Component  
**Description:** Implement task management view  
**Files to modify:**
- MODIFY components/hud/ProjectBrain.tsx
- CREATE components/hud/TaskManager.tsx

**Acceptance Criteria:**
- Display tasks from tasks table
- Status badges (open/in_progress/done/blocked)
- Priority indicators (1-5)
- Filter by status, type, assigned_to
- Create new task form
- Click to edit task details
- Show related files

### Task 4.4: Create Bug Tracker Tab ✅🔲⏭️
**Requirement:** Requirement 14 - ProjectBrain UI Component  
**Description:** Implement bug tracking view  
**Files to modify:**
- MODIFY components/hud/ProjectBrain.tsx
- CREATE components/hud/BugTracker.tsx

**Acceptance Criteria:**
- Display bugs from bugs table
- Severity badges (critical/high/medium/low)
- Status indicators (open/investigating/fixed)
- Filter by severity and status
- Create new bug form with error_trace field
- Click to view full error trace
- Show fix_applied when fixed

### Task 4.5: Create Decision Log Tab ✅🔲⏭️
**Requirement:** Requirement 14 - ProjectBrain UI Component  
**Description:** Implement decision history view  
**Files to modify:**
- MODIFY components/hud/ProjectBrain.tsx
- CREATE components/hud/DecisionLog.tsx

**Acceptance Criteria:**
- Display decisions from decisions table
- Expandable cards for each decision
- Show context, decision, alternatives, impact
- Create new decision form
- Link to superseding decisions
- Timeline view by decided_at

## FASE 5: Knowledge Graph

### Task 5.1: Implement Knowledge Graph Storage ✅🔲⏭️
**Requirement:** Requirement 7 - Knowledge Graph Storage  
**Description:** Create lib/brain/knowledge.ts for graph operations  
**Files to modify:**
- CREATE lib/brain/knowledge.ts

**Acceptance Criteria:**
- createNode() for functions/classes/components
- createEdge() with relation types
- getConnectedNodes(nodeId, depth=1)
- findShortestPath(from, to, maxDepth=5) using BFS
- getNodesByType(projectId, type)
- exportSubgraph(nodeId) as JSON

### Task 5.2: Extract Knowledge Nodes from Code ✅🔲⏭️
**Requirement:** Requirement 7 - Knowledge Graph Storage  
**Description:** Enhance indexer to create knowledge nodes  
**Files to modify:**
- MODIFY lib/brain/indexer.ts

**Acceptance Criteria:**
- Extract functions, classes, components from symbols
- Create knowledge_nodes for each exported symbol
- Store file_path and line_start
- Detect component type (React components)
- Link to project_files.id

### Task 5.3: Extract Knowledge Edges from Code ✅🔲⏭️
**Requirement:** Requirement 7 - Knowledge Graph Storage  
**Description:** Enhance indexer to create knowledge edges  
**Files to modify:**
- MODIFY lib/brain/indexer.ts

**Acceptance Criteria:**
- Create 'imports' edges from dependencies
- Detect function calls for 'calls' edges
- Detect JSX usage for 'renders' edges
- Detect class extends for 'extends' edges
- Store weight based on frequency

### Task 5.4: Implement Knowledge Graph Queries ✅🔲⏭️
**Requirement:** Requirement 15 - Knowledge Graph Queries  
**Description:** Add advanced graph query functions  
**Files to modify:**
- MODIFY lib/brain/knowledge.ts

**Acceptance Criteria:**
- findRelatedNodes(nodeId, edgeTypes, maxDepth)
- findComponentUsage(componentName, projectId)
- findFunctionCallers(functionName, projectId)
- getNodeDependencies(nodeId)
- getNodeDependents(nodeId)
- All queries use recursive CTEs for efficiency

### Task 5.5: Create Knowledge Graph API ✅🔲⏭️
**Requirement:** Requirement 15 - Knowledge Graph Queries  
**Description:** Create API routes for knowledge graph  
**Files to modify:**
- CREATE app/api/brain/graph/route.ts
- CREATE app/api/brain/graph/node/[id]/route.ts

**Acceptance Criteria:**
- GET /api/brain/graph - get full graph for project
- GET /api/brain/graph/node/[id] - get node with connections
- POST /api/brain/graph/query - run custom graph queries
- POST /api/brain/graph/path - find shortest path
- Returns JSON with nodes and edges arrays

### Task 5.6: Create Knowledge Graph Visualization ✅🔲⏭️
**Requirement:** Requirement 14 - ProjectBrain UI Component  
**Description:** Add graph visualization tab to ProjectBrain  
**Files to modify:**
- MODIFY components/hud/ProjectBrain.tsx
- CREATE components/hud/KnowledgeGraph.tsx

**Acceptance Criteria:**
- Use D3.js or react-force-graph for visualization
- Show nodes colored by type
- Show edges as directed arrows
- Click node to highlight connections
- Filter by node type
- Search nodes by name
- Export subgraph as JSON

## Testing & Polish

### Task 6.1: Add Unit Tests ✅🔲⏭️
**Requirement:** Requirement 20 - Testing and Validation  
**Description:** Create unit tests for all modules  
**Files to modify:**
- CREATE lib/brain/__tests__/db.test.ts
- CREATE lib/brain/__tests__/projects.test.ts
- CREATE lib/brain/__tests__/search.test.ts
- CREATE lib/brain/__tests__/indexer.test.ts

**Acceptance Criteria:**
- Test CRUD operations for all tables
- Test BM25 score calculation
- Test symbol extraction
- Test dependency parsing
- Test chunking algorithm
- All tests pass with >80% coverage

### Task 6.2: Add Integration Tests ✅🔲⏭️
**Requirement:** Requirement 20 - Testing and Validation  
**Description:** Create integration tests for workflows  
**Files to modify:**
- CREATE lib/brain/__tests__/integration.test.ts

**Acceptance Criteria:**
- Test full indexing workflow
- Test search with known corpus
- Test context injection
- Test concurrent access scenarios
- Test migration functions

### Task 6.3: Add Performance Tests ✅🔲⏭️
**Requirement:** Requirement 17 - Scalability and Performance  
**Description:** Create performance benchmarks  
**Files to modify:**
- CREATE lib/brain/__tests__/performance.test.ts

**Acceptance Criteria:**
- Benchmark 1000-file indexing (<60s)
- Benchmark search on 100k chunks (<200ms)
- Benchmark concurrent access (10 reads + 5 writes)
- Log results to file for tracking

### Task 6.4: Implement Migration Tools ✅🔲⏭️
**Requirement:** Requirement 19 - Migration from Existing Systems  
**Description:** Create migration functions  
**Files to modify:**
- CREATE lib/brain/migrate.ts
- CREATE app/api/brain/migrate/route.ts

**Acceptance Criteria:**
- migrateFromMemoryDb() reads existing memory.db
- migrateFromLocalStorage() reads fileStore and conversations
- Preserve timestamps from source data
- Deduplicate by checking existing records
- Return migration statistics
- API route to trigger migration

### Task 6.5: Add Error Handling & Logging ✅🔲⏭️
**Requirement:** Requirement 18 - Error Handling and Recovery  
**Description:** Enhance error handling across all modules  
**Files to modify:**
- CREATE lib/brain/errors.ts
- MODIFY all lib/brain/*.ts files

**Acceptance Criteria:**
- BrainError class with error codes
- withRetry() function for DB_LOCKED errors
- Log errors with stack traces
- Validate inputs before writes
- Graceful degradation when features unavailable
- Never crash the app on brain errors

### Task 6.6: Documentation & README ✅🔲⏭️
**Requirement:** All  
**Description:** Create comprehensive documentation  
**Files to modify:**
- CREATE lib/brain/README.md
- CREATE BRAIN_SETUP.md

**Acceptance Criteria:**
- Document all public APIs
- Installation instructions
- Configuration guide
- Usage examples
- Performance tuning guide
- Troubleshooting section
- Architecture diagram

## Task Status Legend
- ✅ = Ready to implement
- 🔲 = Blocked by dependencies
- ⏭️ = Skipped (not in current scope)
