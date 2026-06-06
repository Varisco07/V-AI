import { getDb } from './db';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

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

const DEFAULT_EXCLUDE = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.java', '.rs', '.cpp', '.c', '.h'];

const SYMBOL_PATTERNS: Record<string, RegExp[]> = {
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

const IMPORT_PATTERNS: Record<string, RegExp[]> = {
  typescript: [
    /import\s+.*\s+from\s+['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ],
  javascript: [
    /import\s+.*\s+from\s+['"]([^'"]+)['"]/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ],
  python: [
    /^import\s+(\w+)/gm,
    /^from\s+([\w.]+)\s+import/gm,
  ],
};

export class Indexer {
  private config: IndexerConfig;
  private errors: string[] = [];
  private stats = {
    filesIndexed: 0,
    symbolsFound: 0,
    chunksCreated: 0,
    dependencies: 0,
  };

  constructor(config: Partial<IndexerConfig>) {
    this.config = {
      excludePatterns: DEFAULT_EXCLUDE,
      chunkSize: 400,
      chunkOverlap: 80,
      enableSummaries: false,
      ...config,
    } as IndexerConfig;
  }

  async indexProject(): Promise<IndexResult> {
    const startTime = Date.now();
    const files = this.scanDirectory(this.config.rootPath);

    for (const filePath of files) {
      try {
        await this.indexFile(filePath);
      } catch (error: any) {
        this.errors.push(`${filePath}: ${error.message}`);
      }
    }

    // Update BM25 stats after indexing
    this.updateBM25Stats();

    return {
      ...this.stats,
      timeElapsed: Date.now() - startTime,
      errors: this.errors,
    };
  }

  async indexFile(filePath: string): Promise<void> {
    const db = getDb();
    const content = fs.readFileSync(filePath, 'utf-8');
    const hash = this.computeHash(content);
    const relativePath = path.relative(this.config.rootPath, filePath);
    const language = this.detectLanguage(filePath);

    // Check if file changed
    const existing = db.prepare('SELECT content_hash FROM project_files WHERE project_id = ? AND path = ?')
      .get(this.config.projectId, relativePath) as any;

    if (existing && existing.content_hash === hash) {
      return; // No changes
    }

    const fileId = existing ? existing.id : randomUUID();
    const symbols = this.extractSymbols(content, language);
    const loc = content.split('\n').length;
    const sizeBytes = Buffer.byteLength(content, 'utf-8');

    // Delete old chunks if updating
    if (existing) {
      db.prepare('DELETE FROM rag_chunks WHERE file_id = ?').run(fileId);
    }

    // Insert or update file record
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO project_files 
      (id, project_id, path, content_hash, language, loc, size_bytes, symbols, indexed_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      fileId,
      this.config.projectId,
      relativePath,
      hash,
      language,
      loc,
      sizeBytes,
      JSON.stringify(symbols),
      Date.now(),
      Date.now()
    );

    // Create chunks
    const chunks = this.chunkContent(content);
    const chunkStmt = db.prepare(`
      INSERT INTO rag_chunks (id, file_id, project_id, chunk_index, content, tokens, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    chunks.forEach((chunk, index) => {
      chunkStmt.run(
        randomUUID(),
        fileId,
        this.config.projectId,
        index,
        chunk,
        Math.ceil(chunk.length / 4), // Rough token estimate
        Date.now()
      );
      this.stats.chunksCreated++;
    });

    // Parse dependencies
    this.parseDependencies(content, language, filePath);

    this.stats.filesIndexed++;
    this.stats.symbolsFound += symbols.length;
  }

  private scanDirectory(dir: string): string[] {
    const files: string[] = [];

    const scan = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          if (!this.config.excludePatterns.some(pattern => entry.name.includes(pattern))) {
            scan(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (CODE_EXTENSIONS.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };

    scan(dir);
    return files;
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath);
    const map: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.go': 'go',
      '.java': 'java',
      '.rs': 'rust',
      '.cpp': 'cpp',
      '.c': 'c',
      '.h': 'c',
    };
    return map[ext] || 'text';
  }

  private extractSymbols(content: string, language: string): string[] {
    const patterns = SYMBOL_PATTERNS[language] || [];
    const symbols = new Set<string>();

    for (const pattern of patterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(content)) !== null) {
        if (match[1] && match[1].trim()) {
          symbols.add(match[1].trim());
        }
      }
    }

    return Array.from(symbols);
  }

  private parseDependencies(content: string, language: string, filePath: string): void {
    const db = getDb();
    const patterns = IMPORT_PATTERNS[language] || [];
    const imports = new Set<string>();

    for (const pattern of patterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(content)) !== null) {
        if (match[1]) {
          imports.add(match[1]);
        }
      }
    }

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO file_dependencies (project_id, source_file, target_file, dep_type, symbol)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const importPath of imports) {
      // Resolve relative imports
      let targetPath = importPath;
      if (importPath.startsWith('.')) {
        const dir = path.dirname(filePath);
        targetPath = path.relative(this.config.rootPath, path.resolve(dir, importPath));
      }

      stmt.run(
        this.config.projectId,
        path.relative(this.config.rootPath, filePath),
        targetPath,
        'import',
        null
      );
      this.stats.dependencies++;
    }
  }

  private chunkContent(content: string): string[] {
    const chunks: string[] = [];
    const { chunkSize, chunkOverlap } = this.config;
    let start = 0;

    while (start < content.length) {
      const end = Math.min(start + chunkSize, content.length);
      chunks.push(content.substring(start, end));
      start += chunkSize - chunkOverlap;
    }

    return chunks;
  }

  private computeHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private updateBM25Stats(): void {
    const db = getDb();
    
    // Get all chunks
    const chunks = db.prepare('SELECT id, content FROM rag_chunks WHERE project_id = ?')
      .all(this.config.projectId) as any[];

    // Calculate document frequency for each term
    const termDocFreq = new Map<string, number>();
    const totalDocs = chunks.length;

    for (const chunk of chunks) {
      const terms = this.tokenize(chunk.content);
      const uniqueTerms = new Set(terms);
      
      for (const term of uniqueTerms) {
        termDocFreq.set(term, (termDocFreq.get(term) || 0) + 1);
      }
    }

    // Calculate and store IDF
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO bm25_stats (term, doc_freq, idf, updated_at)
      VALUES (?, ?, ?, ?)
    `);

    for (const [term, docFreq] of termDocFreq) {
      const idf = Math.log((totalDocs - docFreq + 0.5) / (docFreq + 0.5) + 1);
      stmt.run(term, docFreq, idf, Date.now());
    }
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);
  }
}
