import { getDb } from './db';
import { randomUUID } from 'crypto';

export interface Decision {
  id: string;
  project_id: string;
  title: string;
  context?: string;
  decision: string;
  alternatives: string[];
  impact?: string;
  decided_at: number;
}

export function createDecision(data: Omit<Decision, 'id'>): Decision {
  const db = getDb();
  const decision: Decision = {
    id: randomUUID(),
    ...data,
  };

  const stmt = db.prepare(`
    INSERT INTO decisions (id, project_id, title, context, decision, alternatives, impact, decided_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    decision.id,
    decision.project_id,
    decision.title,
    decision.context || null,
    decision.decision,
    JSON.stringify(decision.alternatives),
    decision.impact || null,
    decision.decided_at
  );

  return decision;
}

export function getDecision(id: string): Decision | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM decisions WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return null;

  return {
    ...row,
    alternatives: JSON.parse(row.alternatives),
  };
}

export function getDecisions(projectId: string): Decision[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM decisions WHERE project_id = ? ORDER BY decided_at DESC');
  const rows = stmt.all(projectId) as any[];

  return rows.map(row => ({
    ...row,
    alternatives: JSON.parse(row.alternatives),
  }));
}

export function getRecentDecisions(projectId: string, limit: number = 5): Decision[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM decisions WHERE project_id = ? ORDER BY decided_at DESC LIMIT ?');
  const rows = stmt.all(projectId, limit) as any[];

  return rows.map(row => ({
    ...row,
    alternatives: JSON.parse(row.alternatives),
  }));
}

export function updateDecision(id: string, data: Partial<Omit<Decision, 'id' | 'project_id'>>): void {
  const db = getDb();
  const updates: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.context !== undefined) {
    updates.push('context = ?');
    values.push(data.context);
  }
  if (data.decision !== undefined) {
    updates.push('decision = ?');
    values.push(data.decision);
  }
  if (data.alternatives !== undefined) {
    updates.push('alternatives = ?');
    values.push(JSON.stringify(data.alternatives));
  }
  if (data.impact !== undefined) {
    updates.push('impact = ?');
    values.push(data.impact);
  }

  values.push(id);

  const stmt = db.prepare(`UPDATE decisions SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);
}

export function deleteDecision(id: string): void {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM decisions WHERE id = ?');
  stmt.run(id);
}
