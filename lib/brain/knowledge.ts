import { getDb } from './db';
import { randomUUID } from 'crypto';

export interface KnowledgeNode {
  id: string;
  project_id: string;
  type: 'function' | 'class' | 'component' | 'api' | 'db_table' | 'concept';
  name: string;
  description?: string;
  file_path?: string;
  line_start?: number;
  meta: Record<string, any>;
  updated_at: number;
}

export interface KnowledgeEdge {
  id: number;
  project_id: string;
  from_node: string;
  to_node: string;
  relation: 'calls' | 'renders' | 'extends' | 'imports' | 'stores' | 'reads' | 'writes' | 'uses';
  weight: number;
}

export function createNode(data: Omit<KnowledgeNode, 'id' | 'updated_at'>): KnowledgeNode {
  const db = getDb();
  const node: KnowledgeNode = {
    id: randomUUID(),
    ...data,
    updated_at: Date.now(),
  };

  const stmt = db.prepare(`
    INSERT INTO knowledge_nodes (id, project_id, type, name, description, file_path, line_start, meta, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    node.id,
    node.project_id,
    node.type,
    node.name,
    node.description || null,
    node.file_path || null,
    node.line_start || null,
    JSON.stringify(node.meta),
    node.updated_at
  );

  return node;
}

export function createEdge(data: Omit<KnowledgeEdge, 'id'>): KnowledgeEdge {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO knowledge_edges (project_id, from_node, to_node, relation, weight)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.project_id,
    data.from_node,
    data.to_node,
    data.relation,
    data.weight
  );

  return {
    id: result.lastInsertRowid as number,
    ...data,
  };
}

export function getNode(id: string): KnowledgeNode | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM knowledge_nodes WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return null;

  return {
    ...row,
    meta: JSON.parse(row.meta),
  };
}

export function getConnectedNodes(nodeId: string, depth: number = 1): KnowledgeNode[] {
  const db = getDb();
  
  if (depth === 1) {
    const stmt = db.prepare(`
      SELECT n.* FROM knowledge_nodes n
      JOIN knowledge_edges e ON (e.to_node = n.id OR e.from_node = n.id)
      WHERE (e.from_node = ? OR e.to_node = ?) AND n.id != ?
    `);
    
    const rows = stmt.all(nodeId, nodeId, nodeId) as any[];
    return rows.map(row => ({
      ...row,
      meta: JSON.parse(row.meta),
    }));
  }

  // For depth > 1, use recursive query
  const stmt = db.prepare(`
    WITH RECURSIVE connected(id, depth) AS (
      SELECT ?, 0
      UNION
      SELECT CASE 
        WHEN e.from_node = c.id THEN e.to_node
        ELSE e.from_node
      END, c.depth + 1
      FROM connected c
      JOIN knowledge_edges e ON (e.from_node = c.id OR e.to_node = c.id)
      WHERE c.depth < ?
    )
    SELECT DISTINCT n.* FROM knowledge_nodes n
    JOIN connected c ON n.id = c.id
    WHERE n.id != ?
  `);

  const rows = stmt.all(nodeId, depth, nodeId) as any[];
  return rows.map(row => ({
    ...row,
    meta: JSON.parse(row.meta),
  }));
}

export function findShortestPath(fromNodeId: string, toNodeId: string, maxDepth: number = 5): KnowledgeNode[] {
  const db = getDb();
  
  // BFS using recursive CTE
  const stmt = db.prepare(`
    WITH RECURSIVE path(node_id, path, depth) AS (
      SELECT ?, ?, 0
      UNION
      SELECT 
        CASE WHEN e.from_node = p.node_id THEN e.to_node ELSE e.from_node END,
        p.path || ',' || CASE WHEN e.from_node = p.node_id THEN e.to_node ELSE e.from_node END,
        p.depth + 1
      FROM path p
      JOIN knowledge_edges e ON (e.from_node = p.node_id OR e.to_node = p.node_id)
      WHERE p.depth < ? 
        AND p.path NOT LIKE '%' || CASE WHEN e.from_node = p.node_id THEN e.to_node ELSE e.from_node END || '%'
    )
    SELECT path FROM path WHERE node_id = ? ORDER BY depth LIMIT 1
  `);

  const result = stmt.get(fromNodeId, fromNodeId, maxDepth, toNodeId) as any;
  
  if (!result) return [];

  const nodeIds = result.path.split(',');
  const nodes: KnowledgeNode[] = [];

  for (const id of nodeIds) {
    const node = getNode(id);
    if (node) nodes.push(node);
  }

  return nodes;
}

export function getNodesByType(projectId: string, type: string): KnowledgeNode[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM knowledge_nodes WHERE project_id = ? AND type = ?');
  const rows = stmt.all(projectId, type) as any[];

  return rows.map(row => ({
    ...row,
    meta: JSON.parse(row.meta),
  }));
}

export function findComponentUsage(componentName: string, projectId: string): KnowledgeNode[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT n.* FROM knowledge_nodes n
    JOIN knowledge_edges e ON e.from_node = n.id
    JOIN knowledge_nodes target ON e.to_node = target.id
    WHERE target.name = ? AND target.project_id = ? AND e.relation = 'renders'
  `);

  const rows = stmt.all(componentName, projectId) as any[];
  return rows.map(row => ({
    ...row,
    meta: JSON.parse(row.meta),
  }));
}

export function findFunctionCallers(functionName: string, projectId: string): KnowledgeNode[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT n.* FROM knowledge_nodes n
    JOIN knowledge_edges e ON e.from_node = n.id
    JOIN knowledge_nodes target ON e.to_node = target.id
    WHERE target.name = ? AND target.project_id = ? AND e.relation = 'calls'
  `);

  const rows = stmt.all(functionName, projectId) as any[];
  return rows.map(row => ({
    ...row,
    meta: JSON.parse(row.meta),
  }));
}

export function getNodeDependencies(nodeId: string): KnowledgeNode[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT n.* FROM knowledge_nodes n
    JOIN knowledge_edges e ON e.to_node = n.id
    WHERE e.from_node = ?
  `);

  const rows = stmt.all(nodeId) as any[];
  return rows.map(row => ({
    ...row,
    meta: JSON.parse(row.meta),
  }));
}

export function getNodeDependents(nodeId: string): KnowledgeNode[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT n.* FROM knowledge_nodes n
    JOIN knowledge_edges e ON e.from_node = n.id
    WHERE e.to_node = ?
  `);

  const rows = stmt.all(nodeId) as any[];
  return rows.map(row => ({
    ...row,
    meta: JSON.parse(row.meta),
  }));
}

export function exportSubgraph(nodeId: string, depth: number = 2): { nodes: KnowledgeNode[], edges: KnowledgeEdge[] } {
  const nodes = [getNode(nodeId), ...getConnectedNodes(nodeId, depth)].filter(Boolean) as KnowledgeNode[];
  const nodeIds = new Set(nodes.map(n => n.id));

  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM knowledge_edges 
    WHERE from_node IN (${Array(nodeIds.size).fill('?').join(',')})
      OR to_node IN (${Array(nodeIds.size).fill('?').join(',')})
  `);

  const edges = stmt.all(...Array.from(nodeIds), ...Array.from(nodeIds)) as KnowledgeEdge[];

  return { nodes, edges };
}
