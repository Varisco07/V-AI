import { getDb } from './db';
import { randomUUID } from 'crypto';

export interface Session {
  id: string;
  project_id?: string;
  summary?: string;
  messages_count: number;
  tokens_used: number;
  started_at: number;
  ended_at?: number;
}

export interface SessionContext {
  [key: string]: any;
}

export function createSession(project_id?: string): Session {
  const db = getDb();
  const session: Session = {
    id: randomUUID(),
    project_id,
    messages_count: 0,
    tokens_used: 0,
    started_at: Date.now(),
  };

  const stmt = db.prepare(`
    INSERT INTO sessions (id, project_id, messages_count, tokens_used, started_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(
    session.id,
    session.project_id || null,
    session.messages_count,
    session.tokens_used,
    session.started_at
  );

  return session;
}

export function getSession(id: string): Session | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
  return stmt.get(id) as Session | null;
}

export function setSessionContext(sessionId: string, key: string, value: any): void {
  const db = getDb();
  const contextId = randomUUID();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO session_context (id, session_id, key, value, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(
    contextId,
    sessionId,
    key,
    JSON.stringify(value),
    Date.now()
  );
}

export function getSessionContext(sessionId: string): SessionContext {
  const db = getDb();
  const stmt = db.prepare('SELECT key, value FROM session_context WHERE session_id = ?');
  const rows = stmt.all(sessionId) as any[];

  const context: SessionContext = {};
  for (const row of rows) {
    try {
      context[row.key] = JSON.parse(row.value);
    } catch {
      context[row.key] = row.value;
    }
  }

  return context;
}

export function updateSessionMetadata(
  sessionId: string,
  data: {
    messages_count?: number;
    tokens_used?: number;
    summary?: string;
  }
): void {
  const db = getDb();
  const updates: string[] = [];
  const values: any[] = [];

  if (data.messages_count !== undefined) {
    updates.push('messages_count = ?');
    values.push(data.messages_count);
  }
  if (data.tokens_used !== undefined) {
    updates.push('tokens_used = ?');
    values.push(data.tokens_used);
  }
  if (data.summary !== undefined) {
    updates.push('summary = ?');
    values.push(data.summary);
  }

  values.push(sessionId);

  const stmt = db.prepare(`UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);
}

export function endSession(sessionId: string): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE sessions SET ended_at = ? WHERE id = ?');
  stmt.run(Date.now(), sessionId);
}

export function getProjectSessions(projectId: string, limit: number = 10): Session[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM sessions 
    WHERE project_id = ? 
    ORDER BY started_at DESC 
    LIMIT ?
  `);
  return stmt.all(projectId, limit) as Session[];
}
