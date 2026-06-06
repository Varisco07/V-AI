import { BM25Search } from './search';
import { getProject, getProjectStats } from './projects';
import { getAITasks } from './tasks';
import { getRecentDecisions } from './decisions';
import { getSessionContext } from './sessions';

export interface BrainContext {
  project?: {
    name: string;
    techStack: string[];
    fileCount: number;
    stats: any;
  };
  relevantChunks: any[];
  activeTasks: any[];
  sessionContext: Record<string, any>;
  recentDecisions: any[];
}

export async function buildChatContext(
  message: string,
  sessionId: string,
  projectId?: string,
  maxTokens: number = 1500
): Promise<string> {
  if (!projectId) {
    return '';
  }

  try {
    const project = getProject(projectId);
    if (!project) return '';

    const search = new BM25Search();
    const chunks = search.search(message, projectId, 4);
    
    const sessionCtx = getSessionContext(sessionId);
    const recentDecisions = getRecentDecisions(projectId, 3);

    let context = '=== BRAIN CONTEXT ===\n\n';
    context += `Project: ${project.name}\n`;
    context += `Tech Stack: ${project.tech_stack.join(', ')}\n\n`;

    if (chunks.length > 0) {
      context += 'Relevant Code:\n';
      let tokenCount = 200; // Reserve for headers

      for (const chunk of chunks) {
        const chunkTokens = Math.ceil(chunk.content.length / 4);
        if (tokenCount + chunkTokens > maxTokens) break;

        context += `\nFile: ${chunk.filePath}\n`;
        context += `${chunk.content}\n`;
        context += `---\n`;
        tokenCount += chunkTokens;
      }
    }

    if (Object.keys(sessionCtx).length > 0) {
      context += '\nSession State:\n';
      for (const [key, value] of Object.entries(sessionCtx)) {
        context += `- ${key}: ${JSON.stringify(value)}\n`;
      }
    }

    if (recentDecisions.length > 0) {
      context += '\nRecent Decisions:\n';
      for (const decision of recentDecisions) {
        context += `- ${decision.title}: ${decision.decision}\n`;
      }
    }

    context += '\n=== END BRAIN CONTEXT ===\n';
    return context;
  } catch (error) {
    console.error('Error building chat context:', error);
    return '';
  }
}

export async function buildAgentContext(
  projectId: string,
  maxTokens: number = 1000
): Promise<string> {
  try {
    const project = getProject(projectId);
    if (!project) return '';

    const stats = getProjectStats(projectId);
    const aiTasks = getAITasks(projectId, 3);

    let context = '=== PROJECT CONTEXT ===\n\n';
    context += `Project: ${project.name}\n`;
    context += `Tech Stack: ${project.tech_stack.join(', ')}\n`;
    context += `Files: ${stats.fileCount}\n`;
    context += `Symbols: ${stats.symbolCount}\n\n`;

    if (aiTasks.length > 0) {
      context += 'Pending AI Tasks:\n';
      for (const task of aiTasks) {
        context += `- [${task.type}] ${task.title} (Priority: ${task.priority})\n`;
        if (task.description) {
          context += `  ${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}\n`;
        }
      }
    }

    context += '\n=== END PROJECT CONTEXT ===\n';
    return context;
  } catch (error) {
    console.error('Error building agent context:', error);
    return '';
  }
}

export function formatBrainContext(context: BrainContext): string {
  let formatted = '=== BRAIN CONTEXT ===\n\n';

  if (context.project) {
    formatted += `Project: ${context.project.name}\n`;
    formatted += `Tech Stack: ${context.project.techStack.join(', ')}\n`;
    formatted += `Files: ${context.project.fileCount}\n\n`;
  }

  if (context.relevantChunks.length > 0) {
    formatted += 'Relevant Code:\n';
    for (const chunk of context.relevantChunks) {
      formatted += `\nFile: ${chunk.filePath}\n`;
      formatted += `${chunk.content}\n`;
      formatted += `---\n`;
    }
  }

  if (context.activeTasks.length > 0) {
    formatted += '\nActive Tasks:\n';
    for (const task of context.activeTasks) {
      formatted += `- ${task.title}\n`;
    }
  }

  if (Object.keys(context.sessionContext).length > 0) {
    formatted += '\nSession Context:\n';
    for (const [key, value] of Object.entries(context.sessionContext)) {
      formatted += `- ${key}: ${JSON.stringify(value)}\n`;
    }
  }

  formatted += '\n=== END BRAIN CONTEXT ===\n';
  return formatted;
}
