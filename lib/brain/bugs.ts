import { getDb } from './db';
import { randomUUID } from 'crypto';

export interface Bug {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'confirmed' | 'fixed' | 'wontfix';
  file_path?: string;
  line_number?: number;
  error_trace?: string;
  root_cause?: string;
  fix_applied?: string;
  created_at: number;
  updated_at: number;
  fixed_at?: number;
}

export function createBug(data: Omit<Bug, 'id' | 'created_at' | 'updated_at'>): Bug {
  const db = getDb();
  const now = Date.now();
  const bug: Bug = {
    id: randomUUID(),
    ...data,
    created_at: now,
    updated_at: now,
  };

  const stmt = db.prepare(`
    INSERT INTO bugs (id, project_id, title, description, severity, status, file_path, line_number, error_trace, root_cause, fix_applied, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    bug.id,
    bug.project_id,
    bug.title,
    bug.description || null,
    bug.severity,
    bug.status,
    bug.file_path || null,
    bug.line_number || null,
    bug.error_trace || null,
    bug.root_cause || null,
    bug.fix_applied || null,
    bug.created_at,
    bug.updated_at
  );

  return bug;
}

export function getBug(id: string): Bug | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM bugs WHERE id = ?');
  return stmt.get(id) as Bug | null;
}

export function getBugs(
  projectId: string,
  filters?: {
    severity?: string;
    status?: string;
  }
): Bug[] {
  const db = getDb();
  let query = 'SELECT * FROM bugs WHERE project_id = ?';
  const params: any[] = [projectId];

  if (filters?.severity) {
    query += ' AND severity = ?';
    params.push(filters.severity);
  }
  if (filters?.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  query += ' ORDER BY created_at DESC';

  const stmt = db.prepare(query);
  return stmt.all(...params) as Bug[];
}

export function updateBug(id: string, data: Partial<Omit<Bug, 'id' | 'project_id' | 'created_at'>>): void {
  const db = getDb();
  const updates: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  if (data.severity !== undefined) {
    updates.push('severity = ?');
    values.push(data.severity);
  }
  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
    
    if (data.status === 'fixed') {
      updates.push('fixed_at = ?');
      values.push(Date.now());
    }
  }
  if (data.file_path !== undefined) {
    updates.push('file_path = ?');
    values.push(data.file_path);
  }
  if (data.line_number !== undefined) {
    updates.push('line_number = ?');
    values.push(data.line_number);
  }
  if (data.error_trace !== undefined) {
    updates.push('error_trace = ?');
    values.push(data.error_trace);
  }
  if (data.root_cause !== undefined) {
    updates.push('root_cause = ?');
    values.push(data.root_cause);
  }
  if (data.fix_applied !== undefined) {
    updates.push('fix_applied = ?');
    values.push(data.fix_applied);
  }

  updates.push('updated_at = ?');
  values.push(Date.now());
  values.push(id);

  const stmt = db.prepare(`UPDATE bugs SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);
}

export function deleteBug(id: string): void {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM bugs WHERE id = ?');
  stmt.run(id);
}
