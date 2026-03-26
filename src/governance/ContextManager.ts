import { ProjectContext } from '../types/project';
import { CompressedContext, StateTransferDocument } from '../types/governance';
import { LLMClientFactory } from '../core/llm';

export class ContextManager {
  constructor() {}

  /**
   * Compress context to reduce token count while preserving important information
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

    // Use LLM to intelligently compress context
    const llmClient = await LLMClientFactory.createDefaultClientForAgent('planner');

    const prompt = `
Compress the following context to approximately ${targetTokenLimit} tokens.
Preserve all critical information including requirements, decisions, and key technical details.
Remove redundant information, verbose descriptions, and non-critical details.

Context to compress:
${context}

Return ONLY the compressed context text.
    `.trim();

    const response = await llmClient.generateResponse(prompt);
    const compressedContent = response.content;
    const compressedSize = this.estimateTokenCount(compressedContent);

    return {
      originalSizeTokens: originalSize,
      compressedSizeTokens: compressedSize,
      compressionRatio: Math.round((compressedSize / originalSize) * 100) / 100,
      content: compressedContent,
      preservedElements: ['All critical requirements', 'Key technical decisions', 'Project structure'],
      discardedElements: ['Verbose descriptions', 'Redundant information', 'Non-critical details'],
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
}
