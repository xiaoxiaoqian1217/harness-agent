import { GeneratorAgent, EvaluatorAgent } from '../agents';
import { ProjectContext, Sprint, SprintResult } from '../types/project';
import { IterationResult } from '../types/quality';
import { agentConfig } from '../config';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

export class AdversarialLoop {
  private generator: GeneratorAgent;
  private evaluator: EvaluatorAgent;
  private maxIterations: number;
  private passThreshold: number;
  private pivotThreshold: number;

  constructor(
    generator: GeneratorAgent,
    evaluator: EvaluatorAgent,
    options?: {
      maxIterations?: number;
      passThreshold?: number;
      pivotThreshold?: number;
    }
  ) {
    this.generator = generator;
    this.evaluator = evaluator;
    this.maxIterations = options?.maxIterations || agentConfig.qualityThresholds.maxIterations;
    this.passThreshold = options?.passThreshold || agentConfig.qualityThresholds.minPassScore;
    this.pivotThreshold = options?.pivotThreshold || agentConfig.qualityThresholds.pivotThreshold;
  }

  /**
   * Run the full adversarial iteration loop for a sprint
   */
  async runSprintLoop(
    sprint: Sprint,
    context: ProjectContext,
    projectPath: string
  ): Promise<IterationResult[]> {
    logger.info(`Starting adversarial iteration loop for sprint ${sprint.sprintNumber}`, {
      maxIterations: this.maxIterations,
      passThreshold: this.passThreshold,
      pivotThreshold: this.pivotThreshold,
    });

    const iterationResults: IterationResult[] = [];
    let currentSprintResult: SprintResult;
    let iterationCount = 0;

    while (iterationCount < this.maxIterations) {
      iterationCount++;
      const iterationStartTime = Date.now();

      logger.info(`Starting iteration ${iterationCount}/${this.maxIterations}`);

      try {
        if (iterationCount === 1) {
          // First iteration: implement the sprint from scratch
          currentSprintResult = await this.generator.execute({
            projectPath,
            context,
            sprint,
          });
        } else {
          // Subsequent iterations: refine based on previous feedback
          const previousFeedback = iterationResults[iterationCount - 2].feedback;
          const changes = await this.generator.execute({
            projectPath,
            context,
            feedback: previousFeedback.generalFeedback + '\nImprovement points:\n' +
              previousFeedback.improvementPoints.map(p => `- ${p.description}`).join('\n'),
          });
          currentSprintResult = {
            sprintId: sprint.id,
            success: true,
            generatedFiles: changes,
            gitCommitHash: '', // We'll get this from git later
            buildStatus: true,
            testStatus: true,
          };
        }

        if (!currentSprintResult.success) {
          logger.error(`Iteration ${iterationCount} failed: Generator failed to implement sprint`, {
            errors: currentSprintResult.errors,
          });
          break;
        }

        // Evaluate the result
        const evaluationFeedback = await this.evaluator.execute({
          context,
          sprintResult: currentSprintResult,
        });

        const iterationResult: IterationResult = {
          iterationNumber: iterationCount,
          sprintId: sprint.id,
          qualityScore: evaluationFeedback.qualityScore,
          feedback: evaluationFeedback,
          changes: currentSprintResult.generatedFiles,
          durationMs: Date.now() - iterationStartTime,
        };

        iterationResults.push(iterationResult);

        logger.info(`Iteration ${iterationCount} completed`, {
          overallScore: iterationResult.qualityScore.overall,
          pass: iterationResult.qualityScore.pass,
          needsPivot: iterationResult.qualityScore.needsPivot,
          nextSteps: evaluationFeedback.nextSteps,
        });

        // Check if we can exit the loop
        if (evaluationFeedback.nextSteps === 'approve') {
          logger.info(`Sprint ${sprint.sprintNumber} passed quality threshold after ${iterationCount} iterations`);
          break;
        } else if (evaluationFeedback.nextSteps === 'pivot') {
          logger.info(`Sprint ${sprint.sprintNumber} requires full design pivot after ${iterationCount} iterations`);
          // In a full implementation, we would handle pivot logic here
          break;
        }

      } catch (error) {
        logger.error(`Iteration ${iterationCount} failed with error`, { error });
        break;
      }
    }

    if (iterationCount >= this.maxIterations) {
      logger.warn(`Reached maximum iterations (${this.maxIterations}) without passing quality threshold`);
    }

    logger.info(`Adversarial iteration loop completed for sprint ${sprint.sprintNumber}`, {
      totalIterations: iterationResults.length,
      finalScore: iterationResults[iterationResults.length - 1]?.qualityScore.overall || 0,
      totalDurationMs: iterationResults.reduce((sum, r) => sum + r.durationMs, 0),
    });

    return iterationResults;
  }

  /**
   * Run the full project lifecycle across all sprints
   */
  async runFullProjectLoop(
    context: ProjectContext,
    projectPath: string
  ): Promise<IterationResult[][]> {
    logger.info(`Starting full project iteration loop`, {
      totalSprints: context.plan.totalSprints,
      projectTitle: context.specification.title,
    });

    const allIterationResults: IterationResult[][] = [];

    for (let i = 0; i < context.plan.sprints.length; i++) {
      const sprint = context.plan.sprints[i];
      context.currentSprint = i;

      logger.info(`Processing sprint ${i + 1}/${context.plan.totalSprints}: ${sprint.title}`);

      const sprintIterations = await this.runSprintLoop(sprint, context, projectPath);
      allIterationResults.push(sprintIterations);

      // Check if sprint was successful
      const finalResult = sprintIterations[sprintIterations.length - 1];
      if (!finalResult?.qualityScore.pass) {
        logger.error(`Sprint ${sprint.sprintNumber} failed to meet quality standards after all iterations`);
        // We could choose to stop here or continue depending on configuration
        break;
      }
    }

    logger.info(`Full project iteration loop completed`, {
      completedSprints: allIterationResults.length,
      totalIterations: allIterationResults.flat().length,
    });

    return allIterationResults;
  }
}
