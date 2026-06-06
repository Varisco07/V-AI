import { getDb } from './db';
import { randomUUID } from 'crypto';

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

export interface ProjectStats {
  fileCount: number;
  symbolCount: number;
  taskCount: number;
  bugCount: number;
  chunkCount: number;
  nodeCount: number;
}

export function createProject(data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Project {
  const db = getDb();
  const now = Date.now();
  const project: Project = {
    id: randomUUID(),
    ...data,
    created_at: now,
    updated_at: now,
  };

  const stmt = db.prepare(`
    INSERT INTO projects (id, name, description, root_path, tech_stack, status, meta, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    project.id,
    project.name,
    project.description || null,
    project.root_path || null,
    JSON.stringify(project.tech_stack),
    project.status,
    JSON.stringify(project.meta),
    project.created_at,
    project.updated_at
  );

  return project;
}

export function getProject(id: string): Project | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return null;

  return {
    ...row,
    tech_stack: JSON.parse(row.tech_stack),
    meta: JSON.parse(row.meta),
  };
}

export function getProjectByPath(root_path: string): Project | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM projects WHERE root_path = ?');
  const row = stmt.get(root_path) as any;

  if (!row) return null;

  return {
    ...row,
    tech_stack: JSON.parse(row.tech_stack),
    meta: JSON.parse(row.meta),
  };
}

export function listProjects(status?: string): Project[] {
  const db = getDb();
  let stmt;
  
  if (status) {
    stmt = db.prepare('SELECT * FROM projects WHERE status = ? ORDER BY updated_at DESC');
  } else {
    stmt = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC');
  }

  const rows = status ? stmt.all(status) : stmt.all();

  return (rows as any[]).map(row => ({
    ...row,
    tech_stack: JSON.parse(row.tech_stack),
    meta: JSON.parse(row.meta),
  }));
}

export function updateProject(id: string, data: Partial<Omit<Project, 'id' | 'created_at'>>): void {
  const db = getDb();
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  if (data.root_path !== undefined) {
    updates.push('root_path = ?');
    values.push(data.root_path);
  }
  if (data.tech_stack !== undefined) {
    updates.push('tech_stack = ?');
    values.push(JSON.stringify(data.tech_stack));
  }
  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
  }
  if (data.meta !== undefined) {
    updates.push('meta = ?');
    values.push(JSON.stringify(data.meta));
  }

  updates.push('updated_at = ?');
  values.push(Date.now());
  values.push(id);

  const stmt = db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);
}

export function deleteProject(id: string): void {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  stmt.run(id);
}

export function getProjectStats(projectId: string): ProjectStats {
  const db = getDb();

  const fileCount = db.prepare('SELECT COUNT(*) as count FROM project_files WHERE project_id = ?').get(projectId) as any;
  const chunkCount = db.prepare('SELECT COUNT(*) as count FROM rag_chunks WHERE project_id = ?').get(projectId) as any;
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE project_id = ?').get(projectId) as any;
  const bugCount = db.prepare('SELECT COUNT(*) as count FROM bugs WHERE project_id = ?').get(projectId) as any;
  const nodeCount = db.prepare('SELECT COUNT(*) as count FROM knowledge_nodes WHERE project_id = ?').get(projectId) as any;

  // Count symbols
  const files = db.prepare('SELECT symbols FROM project_files WHERE project_id = ?').all(projectId) as any[];
  const symbolCount = files.reduce((sum, file) => {
    const symbols = JSON.parse(file.symbols);
    return sum + symbols.length;
  }, 0);

  return {
    fileCount: fileCount.count,
    symbolCount,
    taskCount: taskCount.count,
    bugCount: bugCount.count,
    chunkCount: chunkCount.count,
    nodeCount: nodeCount.count,
  };
}
