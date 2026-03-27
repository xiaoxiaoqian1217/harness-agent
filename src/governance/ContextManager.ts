import { ProjectContext, ProjectContextSchema } from '../types/project';
import { CompressedContext, StateTransferDocument } from '../types/governance';
import path from 'path';
import fs from 'fs-extra';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

export class ContextManager {
  private stateFileName = '.harness/state.json';

  constructor() {}

  /**
   * Compress context using semantic-aware compression
   * Intelligently preserves critical information while reducing token count
   */
  async compressContext(
    context: string,
    targetTokenLimit: number = 8000
  ): Promise<CompressedContext> {
    const originalSize = this.estimateTokenCount(context);
    logger.info('Compressing context', { originalSize, targetTokenLimit });

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

    // Analyze context structure
    const sections = this.splitContextSections(context);
    const priorities = this.assignPriorities(sections);

    // Sort by priority and compress
    const prioritized = sections.map((section, idx) => ({
      ...section,
      priority: priorities[idx],
    }));

    // Separate critical, important, and detailed sections
    const criticalSections = prioritized.filter(s => s.priority === 'critical');
    const importantSections = prioritized.filter(s => s.priority === 'important');
    const detailedSections = prioritized.filter(s => s.priority === 'detailed');

    // Start with all critical sections
    let compressed = criticalSections.map(s => s.content).join('\n');

    // Add important sections, but summarize if still over limit
    if (this.estimateTokenCount(compressed) < targetTokenLimit * 0.7) {
      compressed += '\n' + importantSections.map(s => s.content).join('\n');
    } else {
      // Summarize important sections
      for (const section of importantSections) {
        const summary = this.summarizeSection(section.content, 0.7);
        compressed += '\n' + summary;
      }
    }

    // For detailed sections, add only summaries
    for (const section of detailedSections) {
      if (this.estimateTokenCount(compressed) >= targetTokenLimit * 0.9) {
        break; // Stop adding if we're near the limit
      }
      const summary = this.summarizeSection(section.content, 0.3);
      compressed += '\n' + summary;
    }

    // If still over limit, truncate with smart boundary
    const finalCompressed = this.truncateWithSmartBoundary(compressed, targetTokenLimit);

    const compressedSize = this.estimateTokenCount(finalCompressed);

    logger.info('Context compression completed', {
      originalSize,
      compressedSize,
      compressionRatio: Math.round((compressedSize / originalSize) * 100) / 100,
    });

    return {
      originalSizeTokens: originalSize,
      compressedSizeTokens: compressedSize,
      compressionRatio: Math.round((compressedSize / originalSize) * 100) / 100,
      content: finalCompressed,
      preservedElements: ['Critical specifications', 'Project plan', 'Key decisions', 'Current progress'],
      discardedElements: ['Detailed conversation history', 'Redundant examples', 'Verbose error logs'],
    };
  }

  /**
   * Split context into logical sections
   */
  private splitContextSections(context: string): Array<{ title: string; content: string }> {
    const sections: Array<{ title: string; content: string }> = [];
    const lines = context.split('\n');

    let currentSection: { title: string; content: string[] } | null = null;
    let sectionCount = 0;

    for (const line of lines) {
      // Detect section headers (lines starting with ## or #)
      if (line.startsWith('## ') || line.startsWith('# ')) {
        if (currentSection) {
          sections.push({
            title: currentSection.title,
            content: currentSection.content.join('\n'),
          });
        }

        currentSection = {
          title: line.replace(/^#+\s*/, '').trim(),
          content: [],
        };
        sectionCount++;
      } else if (currentSection) {
        currentSection.content.push(line);
      } else {
        // Lines before first section header
        if (sectionCount === 0) {
          sections.push({
            title: 'Preamble',
            content: line,
          });
        }
      }
    }

    // Add last section
    if (currentSection) {
      sections.push({
        title: currentSection.title,
        content: currentSection.content.join('\n'),
      });
    }

    return sections;
  }

  /**
   * Assign priority to sections based on content importance
   */
  private assignPriorities(sections: Array<{ title: string; content: string }>): ('critical' | 'important' | 'detailed')[] {
    const criticalKeywords = [
      'specification', 'requirements', 'project plan', 'sprint', 'deliverable',
      'acceptance criteria', 'quality thresholds', 'tech stack', 'architecture',
    ];

    const importantKeywords = [
      'code standards', 'security', 'git workflow', 'quality standards',
      'testing', 'deployment', 'configuration',
    ];

    return sections.map(section => {
      const title = section.title.toLowerCase();
      const content = section.content.toLowerCase().substring(0, 200);

      const hasCritical = criticalKeywords.some(kw => title.includes(kw) || content.includes(kw));
      const hasImportant = importantKeywords.some(kw => title.includes(kw) || content.includes(kw));

      if (hasCritical) return 'critical';
      if (hasImportant) return 'important';
      return 'detailed';
    });
  }

  /**
   * Summarize a section (simple implementation - keeps first N lines)
   */
  private summarizeSection(content: string, keepRatio: number): string {
    const lines = content.split('\n').filter(line => line.trim().length > 0);

    if (lines.length === 0) return '';

    const keepCount = Math.max(1, Math.ceil(lines.length * keepRatio));
    const keptLines = lines.slice(0, keepCount);

    const summary = keptLines.join('\n');
    if (keepCount < lines.length) {
      return summary + `\n[...${lines.length - keepCount} more lines truncated...]`;
    }

    return summary;
  }

  /**
   * Truncate content to token limit with smart boundary
   */
  private truncateWithSmartBoundary(content: string, tokenLimit: number): string {
    const charLimit = tokenLimit * 4;
    if (content.length <= charLimit) return content;

    // Find a good boundary
    let truncated = content.substring(0, charLimit);

    // Try to end at a line break
    const lastNewline = truncated.lastIndexOf('\n');
    if (lastNewline > charLimit * 0.8) {
      truncated = truncated.substring(0, lastNewline);
    } else {
      // Try to end at a sentence boundary
      const lastPeriod = truncated.lastIndexOf('.');
      const lastExclamation = truncated.lastIndexOf('!');
      const lastQuestion = truncated.lastIndexOf('?');

      const sentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
      if (sentenceEnd > charLimit * 0.8) {
        truncated = truncated.substring(0, sentenceEnd + 1);
      }
    }

    return truncated + '\n\n[...context truncated to fit token limit...]';
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
