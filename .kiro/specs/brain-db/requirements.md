# Requirements Document

## Introduction

**Feature: Persistent AI Memory System (brain.db)**

This document defines the requirements for implementing a comprehensive SQLite-based "brain" system for the N-AI project. The system will provide persistent project management, knowledge graph functionality, enhanced RAG (Retrieval Augmented Generation) with BM25 search, task tracking, decision history, and cross-session context awareness. The brain.db system replaces the current in-memory TF-IDF RAG implementation and localStorage-based state management with a scalable, persistent SQLite database that maintains project awareness across conversations.

## Glossary

- **Brain_System**: The complete SQLite-based persistent memory system for N-AI
- **Brain_DB**: The SQLite database file storing all persistent data
- **Indexer**: Component that scans files and extracts metadata (symbols, dependencies, LOC)
- **BM25_Engine**: Ranking algorithm for relevance scoring based on term frequency and inverse document frequency
- **Knowledge_Graph**: Graph database storing nodes (functions, classes, components) and edges (relationships)
- **RAG_Engine**: Retrieval Augmented Generation system that finds relevant context for AI prompts
- **Context_Injector**: Component that enriches AI prompts with relevant brain context
- **Project**: A codebase tracked by the Brain_System with associated files and metadata
- **Chunk**: A text segment (400 chars) with overlap for RAG retrieval
- **Symbol**: An exported function, class, constant, or API endpoint
- **Session**: A conversation thread with persistent context
- **Task**: A work item (feature/bug/refactor/test/doc) tracked by the Brain_System
- **Decision**: An architectural choice recorded with alternatives and rationale
- **FTS5**: SQLite Full-Text Search version 5 extension for O(log n) search performance
- **WAL_Mode**: Write-Ahead Logging mode for SQLite concurrent read/write access

## Requirements

### Requirement 1: Database Foundation and Initialization

**User Story:** As a developer, I want a persistent SQLite database initialized with proper configuration, so that all brain data is stored reliably across sessions.

#### Acceptance Criteria

1. WHEN the Brain_System is first accessed, THE Brain_DB SHALL create a database file at `.vari-memory/brain.db` with WAL mode enabled
2. THE Brain_DB SHALL create all required tables (projects, project_files, rag_chunks, file_dependencies, knowledge_nodes, knowledge_edges, tasks, bugs, decisions, sessions, session_context) if they do not exist
3. THE Brain_DB SHALL create FTS5 virtual tables for rag_chunks(content), knowledge_nodes(name, description), and tasks(title, description)
4. THE Brain_DB SHALL create indexes on foreign keys, status fields, and timestamp columns for query performance
5. THE Brain_DB SHALL use a singleton connection pool pattern to prevent "database is locked" errors
6. WHEN multiple requests access the Brain_DB concurrently, THE Brain_System SHALL handle read/write operations without blocking or errors

### Requirement 2: Project Management

**User Story:** As a developer, I want to register and manage projects, so that the brain system can track multiple codebases independently.

#### Acceptance Criteria

1. THE Brain_System SHALL provide a function to create a project with name, root_path, tech_stack, and description
2. WHEN a project is created, THE Brain_System SHALL store metadata including created_at and updated_at timestamps
3. THE Brain_System SHALL provide functions to retrieve project by ID or root_path
4. THE Brain_System SHALL provide a function to list all projects with optional filtering by status (active/archived/paused)
5. THE Brain_System SHALL provide a function to update project metadata (tech_stack, status, description)
6. THE Brain_System SHALL provide a function to delete a project and cascade-delete all associated files, chunks, dependencies, and knowledge nodes

### Requirement 3: File Indexing and Metadata Extraction

**User Story:** As a developer, I want the system to automatically index project files and extract metadata, so that the brain understands my codebase structure.

#### Acceptance Criteria

1. THE Indexer SHALL scan a project directory and index all text files (excluding node_modules, .git, dist, build)
2. FOR ALL indexed files, THE Indexer SHALL compute and store: file_path, content_hash (SHA-256), file_size, language, line_count, last_modified timestamp
3. WHEN a file is indexed, THE Indexer SHALL extract exported symbols (function/class/const names) and store them in a JSON array
4. WHEN a file content_hash changes, THE Indexer SHALL update the project_files record and regenerate chunks
5. THE Indexer SHALL detect file language by extension (.ts → TypeScript, .py → Python, .jsx → JavaScript React)
6. THE Indexer SHALL provide a function to reindex a single file when changed
7. THE Indexer SHALL provide a function to reindex an entire project (full scan)
8. WHEN indexing completes, THE Indexer SHALL return statistics (files_indexed, symbols_found, chunks_created, time_elapsed)

### Requirement 4: Dependency Parsing and Relationship Tracking

**User Story:** As a developer, I want the system to track file dependencies, so that I can understand how my codebase components relate to each other.

#### Acceptance Criteria

1. THE Indexer SHALL parse import/require statements from JavaScript, TypeScript, Python, and Go files
2. FOR ALL detected imports, THE Indexer SHALL resolve relative paths to absolute paths within the project
3. WHEN a dependency is found, THE Indexer SHALL store a file_dependencies record linking source_file_id to target_file_id with dependency_type (import/require)
4. THE Brain_System SHALL provide a function to query direct dependencies of a file (files it imports)
5. THE Brain_System SHALL provide a function to query reverse dependencies of a file (files that import it)
6. THE Brain_System SHALL detect circular dependencies and log warnings without failing indexing

### Requirement 5: Persistent RAG with BM25 Search

**User Story:** As a developer, I want persistent RAG chunks with BM25 ranking, so that the AI retrieves the most relevant context from large codebases efficiently.

#### Acceptance Criteria

1. THE RAG_Engine SHALL chunk file content into 400-character segments with 80-character overlap
2. FOR ALL chunks, THE RAG_Engine SHALL compute and store: chunk_id, file_id, chunk_index, content, token_count, tf_idf_terms (JSON array of top 20 terms with frequencies)
3. THE RAG_Engine SHALL store chunks in an FTS5 virtual table for O(log n) full-text search
4. WHEN a search query is received, THE RAG_Engine SHALL use BM25 algorithm with parameters k1=1.5 and b=0.75
5. THE RAG_Engine SHALL implement BM25 formula: score = IDF(term) * (TF(term) * (k1 + 1)) / (TF(term) + k1 * (1 - b + b * (doc_length / avg_doc_length)))
6. THE RAG_Engine SHALL return top-K chunks (default 4) ranked by BM25 score with minimum score threshold of 0.1
7. THE RAG_Engine SHALL provide a function buildBrainContext(query, projectId, maxTokens=2000) that returns formatted context string
8. WHEN chunks are retrieved, THE RAG_Engine SHALL include file_path and line_range metadata for each chunk

### Requirement 6: File Summarization

**User Story:** As a developer, I want the system to generate concise summaries of files, so that I can quickly understand file purposes without reading full content.

#### Acceptance Criteria

1. WHEN a file is indexed, THE Indexer SHALL asynchronously call Ollama to generate a 1-2 sentence summary
2. THE Indexer SHALL use the prompt: "Summarize this code file in 1-2 sentences (what it does, key exports): [file_content]"
3. WHEN summary generation completes, THE Indexer SHALL store the summary in project_files.ai_summary
4. IF Ollama is unavailable, THE Indexer SHALL continue without blocking and leave ai_summary as NULL
5. THE Indexer SHALL rate-limit summary requests to 5 concurrent requests maximum
6. THE Indexer SHALL provide a function to regenerate summaries for all files in a project

### Requirement 7: Knowledge Graph Storage

**User Story:** As a developer, I want the system to build a knowledge graph of my codebase, so that I can query relationships between functions, classes, and components.

#### Acceptance Criteria

1. THE Brain_System SHALL store knowledge_nodes with: node_id, project_id, node_type (function/class/component/api/concept), name, description, file_id, line_number
2. THE Brain_System SHALL store knowledge_edges with: edge_id, source_node_id, target_node_id, edge_type (calls/renders/extends/imports/stores_in/uses), metadata (JSON)
3. THE Brain_System SHALL provide a function to create a knowledge node from extracted symbol data
4. THE Brain_System SHALL provide a function to create a knowledge edge between two nodes
5. THE Brain_System SHALL provide a function to query all nodes connected to a given node (depth=1)
6. THE Brain_System SHALL provide a function to find shortest path between two nodes (BFS traversal, max depth=5)
7. THE Brain_System SHALL provide a function to query all nodes by type within a project

### Requirement 8: Task Management

**User Story:** As a developer, I want to track tasks with AI assignments, so that the AI can autonomously work on prioritized items.

#### Acceptance Criteria

1. THE Brain_System SHALL store tasks with: task_id, project_id, type (feature/bug/refactor/test/doc), title, description, status (todo/in_progress/done/blocked), priority (1-5), assigned_to_ai (boolean)
2. THE Brain_System SHALL provide a function to create a task with all required fields
3. THE Brain_System SHALL provide a function to update task status and priority
4. THE Brain_System SHALL provide a function to query tasks by project_id, status, and assigned_to_ai filter
5. THE Brain_System SHALL provide a function to query AI-assigned tasks ordered by priority DESC
6. WHEN a task is marked done, THE Brain_System SHALL set completed_at timestamp
7. THE Brain_System SHALL provide full-text search on task title and description using FTS5

### Requirement 9: Bug Tracking

**User Story:** As a developer, I want to track bugs with error traces and root cause analysis, so that I can systematically resolve issues.

#### Acceptance Criteria

1. THE Brain_System SHALL store bugs with: bug_id, project_id, title, description, severity (critical/high/medium/low), status (open/investigating/fixed/wontfix), error_trace, root_cause, fix_description
2. THE Brain_System SHALL provide a function to create a bug with title, description, severity, and optional error_trace
3. THE Brain_System SHALL provide a function to update bug status, root_cause, and fix_description
4. THE Brain_System SHALL provide a function to query bugs by project_id, severity, and status
5. THE Brain_System SHALL automatically link bugs to related files by parsing error_trace for file paths
6. WHEN a bug is marked fixed, THE Brain_System SHALL set fixed_at timestamp and require fix_description

### Requirement 10: Decision History Tracking

**User Story:** As a developer, I want to record architectural decisions with alternatives and rationale, so that I understand why choices were made.

#### Acceptance Criteria

1. THE Brain_System SHALL store decisions with: decision_id, project_id, title, context, decision, alternatives (JSON array), rationale, impact, status (proposed/accepted/rejected/superseded)
2. THE Brain_System SHALL provide a function to create a decision with title, context, decision text, alternatives, and rationale
3. THE Brain_System SHALL provide a function to update decision status and impact assessment
4. THE Brain_System SHALL provide a function to query decisions by project_id and status
5. THE Brain_System SHALL provide a function to link a decision to related files and tasks (via JSON metadata)
6. WHEN a decision is superseded, THE Brain_System SHALL require a reference to the superseding decision_id

### Requirement 11: Session Management and Persistent Context

**User Story:** As a developer, I want conversation sessions with persistent context, so that the AI remembers project state across interactions.

#### Acceptance Criteria

1. THE Brain_System SHALL store sessions with: session_id, project_id, title, message_count, total_tokens, created_at, last_activity_at
2. THE Brain_System SHALL store session_context key-value pairs with: session_id, key, value, value_type (string/number/json)
3. THE Brain_System SHALL provide a function to create a session linked to a project
4. THE Brain_System SHALL provide a function to set session context key-value pairs (upsert)
5. THE Brain_System SHALL provide a function to get all context for a session as a JSON object
6. THE Brain_System SHALL provide a function to update session metadata (message_count, total_tokens, last_activity_at)
7. THE Brain_System SHALL automatically archive sessions inactive for 30+ days (set status=archived)

### Requirement 12: Context Injection for chat-local

**User Story:** As a user, I want the AI chat to include relevant brain context in responses, so that answers are informed by my project state.

#### Acceptance Criteria

1. WHEN a chat-local message is received, THE Context_Injector SHALL query the Brain_System for the active project
2. THE Context_Injector SHALL build RAG context using buildBrainContext(query=message, projectId, maxTokens=1500)
3. THE Context_Injector SHALL retrieve the current session context as key-value pairs
4. THE Context_Injector SHALL format brain context as: "=== BRAIN CONTEXT ===\nProject: [name]\nRelevant Code:\n[chunks]\nSession State: [context]\n=== END BRAIN ===\"
5. THE Context_Injector SHALL prepend brain context to the Ollama prompt before chat history
6. IF no project is active, THE Context_Injector SHALL skip brain context injection
7. THE Context_Injector SHALL limit total brain context to 2000 tokens to preserve prompt space

### Requirement 13: Context Injection for agent

**User Story:** As a user, I want the AI agent to use brain context during planning, so that autonomous tasks are informed by project structure.

#### Acceptance Criteria

1. WHEN an agent request is received, THE Context_Injector SHALL query the Brain_System for the active project
2. THE Context_Injector SHALL retrieve project metadata (tech_stack, file_count, recent tasks)
3. THE Context_Injector SHALL retrieve AI-assigned tasks ordered by priority (top 3)
4. THE Context_Injector SHALL format agent context as: "=== PROJECT CONTEXT ===\nProject: [name] ([tech_stack])\nFiles: [count]\nPending Tasks:\n- [task 1]\n- [task 2]\n=== END CONTEXT ==="
5. THE Context_Injector SHALL inject agent context after the base agent prompt and before the user message
6. THE Context_Injector SHALL update task status to in_progress when agent starts working on a task
7. THE Context_Injector SHALL update task status to done when agent completes a task

### Requirement 14: ProjectBrain UI Component

**User Story:** As a user, I want a UI panel to view and manage brain data, so that I can interact with the brain system visually.

#### Acceptance Criteria

1. THE ProjectBrain component SHALL display the active project name and status
2. THE ProjectBrain component SHALL show project statistics: file_count, symbol_count, task_count, bug_count
3. THE ProjectBrain component SHALL provide tabs for: Files, Tasks, Bugs, Decisions, Knowledge Graph
4. THE ProjectBrain component SHALL display a searchable file list with language icons and summary tooltips
5. THE ProjectBrain component SHALL display a task list with status badges and priority indicators
6. THE ProjectBrain component SHALL provide forms to create tasks and bugs
7. THE ProjectBrain component SHALL provide a decision log with expandable details
8. THE ProjectBrain component SHALL include a "Reindex Project" button that triggers full scan

### Requirement 15: Knowledge Graph Queries

**User Story:** As a developer, I want to query the knowledge graph, so that I can understand component relationships and dependencies.

#### Acceptance Criteria

1. THE Brain_System SHALL provide a function findRelatedNodes(nodeId, edgeTypes=[], maxDepth=2) that returns connected nodes
2. THE Brain_System SHALL provide a function findComponentUsage(componentName, projectId) that returns all files rendering the component
3. THE Brain_System SHALL provide a function findFunctionCallers(functionName, projectId) that returns all functions calling the target
4. THE Brain_System SHALL provide a function getNodeDependencies(nodeId) that returns all nodes the target depends on
5. THE Brain_System SHALL provide a function getNodeDependents(nodeId) that returns all nodes depending on the target
6. THE Brain_System SHALL provide a function to export a subgraph as JSON with nodes and edges arrays

### Requirement 16: BM25 Configuration Parser

**User Story:** As a developer, I want to parse and precompute BM25 term statistics, so that search queries execute efficiently.

#### Acceptance Criteria

1. THE Pretty_Printer SHALL format BM25 configuration parameters (k1, b, avgDocLength) into human-readable JSON
2. WHEN chunks are created, THE RAG_Engine SHALL compute document frequency (DF) for all terms across the corpus
3. THE RAG_Engine SHALL compute inverse document frequency (IDF) = log((N - DF + 0.5) / (DF + 0.5) + 1) for each term
4. THE RAG_Engine SHALL store precomputed IDF values in a separate bm25_stats table with columns: term, doc_freq, idf
5. WHEN the corpus changes, THE RAG_Engine SHALL recompute IDF statistics incrementally for new terms
6. FOR ALL valid BM25 configurations, parsing then printing then parsing SHALL produce an equivalent configuration object (round-trip property)

### Requirement 17: Scalability and Performance

**User Story:** As a developer, I want the brain system to handle large projects efficiently, so that performance remains acceptable as projects grow.

#### Acceptance Criteria

1. THE Brain_System SHALL index 1000 files in under 60 seconds on a typical development machine (quad-core, SSD)
2. THE RAG_Engine SHALL return search results for a query in under 200ms for a corpus of 100,000 chunks
3. THE Brain_DB SHALL support concurrent read operations without blocking (WAL mode)
4. THE Indexer SHALL process files in batches of 50 to prevent memory exhaustion on large projects
5. THE Brain_System SHALL implement connection pooling with max 5 concurrent connections
6. THE Brain_System SHALL vacuum the database automatically when total size exceeds 500MB and deleted data > 25%

### Requirement 18: Error Handling and Recovery

**User Story:** As a developer, I want the brain system to handle errors gracefully, so that failures don't corrupt data or crash the application.

#### Acceptance Criteria

1. WHEN a database operation fails, THE Brain_System SHALL log the error with stack trace and return a meaningful error message
2. WHEN file parsing fails, THE Indexer SHALL log the error, skip the file, and continue indexing remaining files
3. WHEN Ollama summarization fails, THE Indexer SHALL retry once after 2 seconds before giving up
4. WHEN database lock errors occur, THE Brain_System SHALL retry the operation up to 3 times with exponential backoff (100ms, 200ms, 400ms)
5. THE Brain_System SHALL validate all inputs (project_id exists, file paths are within project root) before database writes
6. WHEN initialization fails, THE Brain_System SHALL log the error and disable brain features without crashing the app

### Requirement 19: Migration from Existing Systems

**User Story:** As a developer, I want to migrate data from existing memory and localStorage systems, so that no data is lost during the transition.

#### Acceptance Criteria

1. THE Brain_System SHALL provide a migration function to import existing memory.db data into brain.db
2. THE Brain_System SHALL provide a migration function to import localStorage conversations into sessions and session_context tables
3. THE Brain_System SHALL provide a migration function to import localStorage fileStore entries as project files
4. WHEN migration runs, THE Brain_System SHALL preserve all timestamps (created_at, updated_at) from source data
5. THE Brain_System SHALL deduplicate data by checking for existing records before inserting
6. THE Brain_System SHALL log migration statistics (records_migrated, duplicates_skipped, errors_encountered)

### Requirement 20: Testing and Validation

**User Story:** As a developer, I want comprehensive tests for the brain system, so that I can confidently deploy and maintain it.

#### Acceptance Criteria

1. THE Brain_System SHALL include unit tests for all CRUD operations (create, read, update, delete) on all tables
2. THE Brain_System SHALL include integration tests for the complete indexing workflow (scan → parse → chunk → store)
3. THE Brain_System SHALL include performance tests validating 1000-file indexing completes in under 60 seconds
4. THE Brain_System SHALL include tests validating BM25 search returns correct results for known queries
5. THE Brain_System SHALL include tests validating round-trip parsing for BM25 configuration objects
6. THE Brain_System SHALL include tests for concurrent access scenarios (10 parallel reads, 5 parallel writes)
7. THE Brain_System SHALL include tests for error scenarios (database locked, file not found, Ollama unavailable)

