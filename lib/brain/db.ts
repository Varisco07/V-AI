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
    
    // Projects table
    db.exec(`
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
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
      CREATE INDEX IF NOT EXISTS idx_projects_root_path ON projects(root_path);
    `);

    // File index table
    db.exec(`
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
      CREATE INDEX IF NOT EXISTS idx_files_project ON project_files(project_id);
      CREATE INDEX IF NOT EXISTS idx_files_language ON project_files(language);
      CREATE INDEX IF NOT EXISTS idx_files_hash ON project_files(content_hash);
    `);

    // RAG chunks table
    db.exec(`
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
      CREATE INDEX IF NOT EXISTS idx_chunks_file ON rag_chunks(file_id);
      CREATE INDEX IF NOT EXISTS idx_chunks_project ON rag_chunks(project_id);
    `);

    // FTS5 virtual table for chunks
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS rag_chunks_fts USING fts5(
        chunk_id UNINDEXED,
        content,
        content=rag_chunks,
        content_rowid=rowid
      );
    `);

    // Triggers to keep FTS5 in sync
    db.exec(`
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
    `);

    // BM25 statistics table
    db.exec(`
      CREATE TABLE IF NOT EXISTS bm25_stats (
        term TEXT PRIMARY KEY,
        doc_freq INTEGER NOT NULL,
        idf REAL NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_bm25_term ON bm25_stats(term);
    `);

    // File dependencies table
    db.exec(`
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
      CREATE INDEX IF NOT EXISTS idx_deps_source ON file_dependencies(project_id, source_file);
      CREATE INDEX IF NOT EXISTS idx_deps_target ON file_dependencies(project_id, target_file);
    `);

    // Knowledge graph nodes
    db.exec(`
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
      CREATE INDEX IF NOT EXISTS idx_nodes_project ON knowledge_nodes(project_id);
      CREATE INDEX IF NOT EXISTS idx_nodes_type ON knowledge_nodes(type);
      CREATE INDEX IF NOT EXISTS idx_nodes_name ON knowledge_nodes(name);
    `);

    // Knowledge graph edges
    db.exec(`
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
      CREATE INDEX IF NOT EXISTS idx_edges_from ON knowledge_edges(from_node);
      CREATE INDEX IF NOT EXISTS idx_edges_to ON knowledge_edges(to_node);
      CREATE INDEX IF NOT EXISTS idx_edges_relation ON knowledge_edges(relation);
    `);

    // Tasks table
    db.exec(`
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
      CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    `);

    // Bugs table
    db.exec(`
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
      CREATE INDEX IF NOT EXISTS idx_bugs_project ON bugs(project_id);
      CREATE INDEX IF NOT EXISTS idx_bugs_status ON bugs(status);
      CREATE INDEX IF NOT EXISTS idx_bugs_severity ON bugs(severity);
    `);

    // Decisions table
    db.exec(`
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
      CREATE INDEX IF NOT EXISTS idx_decisions_project ON decisions(project_id);
    `);

    // Sessions table
    db.exec(`
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
      CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
    `);

    // Session context table
    db.exec(`
      CREATE TABLE IF NOT EXISTS session_context (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        UNIQUE(session_id, key)
      );
      CREATE INDEX IF NOT EXISTS idx_context_session ON session_context(session_id);
    `);
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
