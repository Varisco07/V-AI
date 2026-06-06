import { getDb } from './db';
import { randomUUID } from 'crypto';

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  type: 'feature' | 'bug' | 'refactor' | 'test' | 'doc';
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  priority: number; // 1=critical, 2=high, 3=medium, 4=low, 5=trivial
  assigned_to: string;
  parent_task?: string;
  related_files: string[];
  ai_notes?: string;
  created_at: number;
  updated_at: number;
  completed_at?: number;
}

export function createTask(data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Task {
  const db = getDb();
  const now = Date.now();
  const task: Task = {
    id: randomUUID(),
    ...data,
    created_at: now,
    updated_at: now,
  };

  const stmt = db.prepare(`
    INSERT INTO tasks (id, project_id, title, description, type, status, priority, assigned_to, parent_task, related_files, ai_notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    task.id,
    task.project_id,
    task.title,
    task.description || null,
    task.type,
    task.status,
    task.priority,
    task.assigned_to,
    task.parent_task || null,
    JSON.stringify(task.related_files),
    task.ai_notes || null,
    task.created_at,
    task.updated_at
  );

  return task;
}

export function getTask(id: string): Task | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return null;

  return {
    ...row,
    related_files: JSON.parse(row.related_files),
  };
}

export function getTasks(
  projectId: string,
  filters?: {
    status?: string;
    type?: string;
    assigned_to?: string;
    priority?: number;
  }
): Task[] {
  const db = getDb();
  let query = 'SELECT * FROM tasks WHERE project_id = ?';
  const params: any[] = [projectId];

  if (filters?.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters?.type) {
    query += ' AND type = ?';
    params.push(filters.type);
  }
  if (filters?.assigned_to) {
    query += ' AND assigned_to = ?';
    params.push(filters.assigned_to);
  }
  if (filters?.priority) {
    query += ' AND priority = ?';
    params.push(filters.priority);
  }

  query += ' ORDER BY priority ASC, created_at DESC';

  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as any[];

  return rows.map(row => ({
    ...row,
    related_files: JSON.parse(row.related_files),
  }));
}

export function getAITasks(projectId: string, limit: number = 10): Task[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM tasks 
    WHERE project_id = ? AND assigned_to = 'ai' AND status != 'done' AND status != 'cancelled'
    ORDER BY priority ASC, created_at DESC
    LIMIT ?
  `);

  const rows = stmt.all(projectId, limit) as any[];

  return rows.map(row => ({
    ...row,
    related_files: JSON.parse(row.related_files),
  }));
}

export function updateTask(id: string, data: Partial<Omit<Task, 'id' | 'project_id' | 'created_at'>>): void {
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
  if (data.type !== undefined) {
    updates.push('type = ?');
    values.push(data.type);
  }
  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
    
    if (data.status === 'done') {
      updates.push('completed_at = ?');
      values.push(Date.now());
    }
  }
  if (data.priority !== undefined) {
    updates.push('priority = ?');
    values.push(data.priority);
  }
  if (data.assigned_to !== undefined) {
    updates.push('assigned_to = ?');
    values.push(data.assigned_to);
  }
  if (data.related_files !== undefined) {
    updates.push('related_files = ?');
    values.push(JSON.stringify(data.related_files));
  }
  if (data.ai_notes !== undefined) {
    updates.push('ai_notes = ?');
    values.push(data.ai_notes);
  }

  updates.push('updated_at = ?');
  values.push(Date.now());
  values.push(id);

  const stmt = db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);
}

export function deleteTask(id: string): void {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  stmt.run(id);
}
