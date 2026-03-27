import { ProjectContext, ProjectContextSchema } from '../types/project';
import { CompressedContext, StateTransferDocument } from '../types/governance';
import path from 'path';
import fs from 'fs-extra';

export class ContextManager {
  private stateFileName = '.harness/state.json';

  constructor() {}

  /**
   * Compress context to reduce token count while preserving important information
   * Simple implementation - truncates long texts while preserving structure
   */
  async compressContext(
    context: string,
    targetTokenLimit: number = 8000
  ): Promise<CompressedContext> {
    const originalSize = this.estimateTokenCount(context);

    if (originalSize <= targetTokenLimit) {
      return {
        originalSizeTokens: originalSize,
        compressedSizeTokens: originalSize,
        compressionRatio: 1,
        content: context,
        preservedElements: ['Full context preserved'],
        discardedElements: [],
      };
    }

    // Simple truncation for now - in production this would use more sophisticated methods
    const charLimit = targetTokenLimit * 4; // Rough estimate: 4 chars ≈ 1 token
    let compressedContent = context.substring(0, charLimit);

    // Try to end on a clean boundary
    const lastNewline = compressedContent.lastIndexOf('\n');
    if (lastNewline > charLimit * 0.8) {
      compressedContent = compressedContent.substring(0, lastNewline);
    }

    compressedContent += '\n\n[...content truncated for brevity...]';

    const compressedSize = this.estimateTokenCount(compressedContent);

    return {
      originalSizeTokens: originalSize,
      compressedSizeTokens: compressedSize,
      compressionRatio: Math.round((compressedSize / originalSize) * 100) / 100,
      content: compressedContent,
      preservedElements: ['Beginning of context', 'Structure preserved'],
      discardedElements: ['End of context', 'Verbose details'],
    };
  }

  /**
   * Create a state transfer document for context reset
   */
  async createStateTransfer(context: ProjectContext): Promise<StateTransferDocument> {
    return {
      projectId: context.projectId,
      version: '1.0',
      timestamp: new Date(),
      projectSpecification: context.specification,
      currentProgress: {
        completedSprints: context.plan.sprints
          .filter((_, index) => index < context.currentSprint)
          .map(s => s.id),
        currentSprint: context.plan.sprints[context.currentSprint],
        iterationCount: context.iterationCount,
        qualityHistory: [], // We would populate this with actual history in a full implementation
      },
      keyDecisions: [
        {
          decision: `Selected tech stack: ${JSON.stringify(context.specification.techStack)}`,
          context: 'Based on project requirements analysis',
          timestamp: context.createdAt,
        },
        {
          decision: `Project architecture: ${context.specification.architecture.isSeparateFrontendBackend ? 'Separate frontend/backend' : 'Monolithic'}`,
          context: 'Based on project complexity and scalability requirements',
          timestamp: context.createdAt,
        },
      ],
      pendingTasks: context.plan.sprints
        .slice(context.currentSprint)
        .flatMap(sprint => sprint.tasks.map(task => task.title)),
      openIssues: [],
      nextSteps: [
        `Continue with sprint ${context.currentSprint + 1}: ${context.plan.sprints[context.currentSprint]?.title}`,
        'Implement pending tasks',
        'Run quality evaluation after sprint completion',
      ],
    };
  }

  /**
   * Serialize state transfer document to string for storage
   */
  serializeStateTransfer(doc: StateTransferDocument): string {
    return JSON.stringify(doc, null, 2);
  }

  /**
   * Deserialize state transfer document from string
   */
  deserializeStateTransfer(content: string): StateTransferDocument {
    return JSON.parse(content);
  }

  /**
   * Estimate token count for a given text (rough estimation)
   */
  estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Save project context to disk
   */
  async saveState(context: ProjectContext, projectPath: string): Promise<void> {
    const stateDir = path.join(projectPath, '.harness');
    await fs.mkdirp(stateDir);

    const statePath = path.join(projectPath, this.stateFileName);

    // Convert Date objects to strings for JSON serialization
    const contextToSave = {
      ...context,
      createdAt: context.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(statePath, JSON.stringify(contextToSave, null, 2));
  }

  /**
   * Load project context from disk
   */
  async loadState(projectPath: string): Promise<ProjectContext | null> {
    const statePath = path.join(projectPath, this.stateFileName);

    if (!await fs.pathExists(statePath)) {
      return null;
    }

    try {
      const content = await fs.readFile(statePath, 'utf-8');
      const parsed = JSON.parse(content);

      // Convert strings back to Date objects
      const context: ProjectContext = {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
      };

      return ProjectContextSchema.parse(context);
    } catch (error) {
      console.warn('Failed to load state:', error);
      return null;
    }
  }
}
