import { getDb } from './db';

export interface SearchResult {
  chunkId: string;
  fileId: string;
  filePath: string;
  content: string;
  score: number;
  chunkIndex: number;
}

export interface BM25Config {
  k1: number;
  b: number;
}

export class BM25Search {
  private config: BM25Config;

  constructor(config?: Partial<BM25Config>) {
    this.config = {
      k1: 1.5,
      b: 0.75,
      ...config,
    };
  }

  search(query: string, projectId: string, topK: number = 5, minScore: number = 0.1): SearchResult[] {
    const db = getDb();
    const terms = this.tokenize(query);

    if (terms.length === 0) return [];

    // Get IDF values for query terms
    const idfMap = new Map<string, number>();
    const idfStmt = db.prepare('SELECT term, idf FROM bm25_stats WHERE term = ?');
    
    for (const term of terms) {
      const row = idfStmt.get(term) as any;
      if (row) {
        idfMap.set(term, row.idf);
      }
    }

    // Use FTS5 to get candidate chunks
    const ftsQuery = terms.join(' OR ');
    const candidates = db.prepare(`
      SELECT c.id, c.file_id, c.content, c.chunk_index, f.path
      FROM rag_chunks c
      JOIN project_files f ON c.file_id = f.id
      WHERE c.project_id = ? AND c.id IN (
        SELECT chunk_id FROM rag_chunks_fts WHERE rag_chunks_fts MATCH ?
      )
    `).all(projectId, ftsQuery) as any[];

    // Calculate average document length
    const avgDocLength = db.prepare(`
      SELECT AVG(LENGTH(content)) as avg FROM rag_chunks WHERE project_id = ?
    `).get(projectId) as any;

    const avgLen = avgDocLength.avg || 400;

    // Score each candidate
    const results: SearchResult[] = [];

    for (const candidate of candidates) {
      const docLength = candidate.content.length;
      const contentLower = candidate.content.toLowerCase();
      let totalScore = 0;

      for (const term of terms) {
        const idf = idfMap.get(term) || 0;
        if (idf === 0) continue;

        // Calculate term frequency
        const termFreq = this.countOccurrences(contentLower, term);
        
        // BM25 score for this term
        const score = this.computeBM25(termFreq, docLength, avgLen, idf);
        totalScore += score;
      }

      if (totalScore >= minScore) {
        results.push({
          chunkId: candidate.id,
          fileId: candidate.file_id,
          filePath: candidate.path,
          content: candidate.content,
          score: totalScore,
          chunkIndex: candidate.chunk_index,
        });
      }
    }

    // Sort by score descending and return top K
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  buildBrainContext(query: string, projectId: string, maxTokens: number = 2000): string {
    const results = this.search(query, projectId, 5);
    
    if (results.length === 0) {
      return '';
    }

    let context = '=== BRAIN CONTEXT ===\n';
    let tokenCount = 0;

    for (const result of results) {
      const chunkTokens = Math.ceil(result.content.length / 4);
      if (tokenCount + chunkTokens > maxTokens) {
        break;
      }

      context += `\nFile: ${result.filePath}\n`;
      context += `${result.content}\n`;
      context += `---\n`;
      tokenCount += chunkTokens;
    }

    context += '=== END BRAIN CONTEXT ===\n';
    return context;
  }

  private computeBM25(termFreq: number, docLength: number, avgDocLength: number, idf: number): number {
    const { k1, b } = this.config;
    const numerator = termFreq * (k1 + 1);
    const denominator = termFreq + k1 * (1 - b + b * (docLength / avgDocLength));
    return idf * (numerator / denominator);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);
  }

  private countOccurrences(text: string, term: string): number {
    const regex = new RegExp(`\\b${term}\\b`, 'g');
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }
}

export function updateIDFStats(projectId: string): void {
  const db = getDb();
  
  // Get all chunks
  const chunks = db.prepare('SELECT id, content FROM rag_chunks WHERE project_id = ?')
    .all(projectId) as any[];

  // Calculate document frequency for each term
  const termDocFreq = new Map<string, number>();
  const totalDocs = chunks.length;

  const tokenize = (text: string): string[] => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);
  };

  for (const chunk of chunks) {
    const terms = tokenize(chunk.content);
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
