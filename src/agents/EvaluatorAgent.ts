import { BaseAgent } from './BaseAgent';
import { ProjectContext, SprintResult } from '../types/project';
import { EvaluationFeedback, QualityScore } from '../types/quality';
import { defaultQualityRubric } from '../config';
import { chromium, Browser, Page } from 'playwright';

export class EvaluatorAgent extends BaseAgent {
  private browser: Browser | undefined;

  constructor() {
    super('evaluator');
  }

  /**
   * Initialize the evaluator agent
   */
  async initialize(_projectPath?: string): Promise<void> {
    await super.initialize();

    // Initialize Playwright browser
    this.browser = await chromium.launch({
      headless: true,
    });

    this.logger.info('Evaluator agent initialized');
  }

  /**
   * Evaluate the overall quality of the project
   */
  async evaluateProject(context: ProjectContext, _sprintResult?: SprintResult): Promise<EvaluationFeedback> {
    this.logger.info('Evaluating project quality');

    // Run all evaluation dimensions
    const [designScore, originalityScore, craftScore, usabilityScore] = await Promise.all([
      this.evaluateDesignQuality(context),
      this.evaluateOriginality(context),
      this.evaluateCraftExecution(context),
      this.evaluateFunctionalUsability(context),
    ]);

    // Calculate overall score
    const overallScore = Math.round(
      designScore.score * defaultQualityRubric.weights.designQuality! +
      originalityScore.score * defaultQualityRubric.weights.originality! +
      craftScore.score * defaultQualityRubric.weights.craftExecution! +
      usabilityScore.score * defaultQualityRubric.weights.functionalUsability!
    );

    const qualityScore: QualityScore = {
      overall: overallScore,
      dimensions: {
        designQuality: designScore,
        originality: originalityScore,
        craftExecution: craftScore,
        functionalUsability: usabilityScore,
      },
      pass: overallScore >= defaultQualityRubric.passThreshold,
      needsPivot: overallScore < defaultQualityRubric.pivotThreshold,
      summary: this.generateQualitySummary({ designScore, originalityScore, craftScore, usabilityScore, overallScore }),
    };

    // Generate improvement points
    const improvementPoints = this.generateImprovementPoints(qualityScore);

    // Determine next steps
    let nextSteps: 'approve' | 'refine' | 'pivot' = 'refine';
    if (qualityScore.pass) {
      nextSteps = 'approve';
    } else if (qualityScore.needsPivot) {
      nextSteps = 'pivot';
    }

    this.logger.info('Project evaluation completed', {
      overallScore,
      pass: qualityScore.pass,
      needsPivot: qualityScore.needsPivot,
      nextSteps,
    });

    return {
      qualityScore,
      testResults: [], // We'll add actual test results later
      generalFeedback: qualityScore.summary,
      improvementPoints,
      nextSteps,
    };
  }

  /**
   * Evaluate design quality dimension
   */
  private async evaluateDesignQuality(context: ProjectContext): Promise<{ score: number; feedback: string; suggestions: string[] }> {
    this.logger.info('Evaluating design quality');

    const prompt = `
Evaluate the design quality of the following project:

Project Title: ${context.specification.title}
Design Guidelines: ${JSON.stringify(context.specification.designGuidelines)}

Evaluate based on:
1. Visual identity coherence and consistency
2. Alignment with modern design principles and trends
3. Brand alignment (if applicable)
4. Overall aesthetic appeal (aim for museum-grade quality)

Score from 0-100, and provide detailed feedback and improvement suggestions.
Return ONLY a JSON object with:
{
  "score": number,
  "feedback": "detailed feedback text",
  "suggestions": ["list of improvement suggestions"]
}
    `.trim();

    const response = await this.generateResponse(prompt);
    return JSON.parse(response.content);
  }

  /**
   * Evaluate originality dimension
   */
  private async evaluateOriginality(context: ProjectContext): Promise<{ score: number; feedback: string; suggestions: string[] }> {
    this.logger.info('Evaluating design originality');

    const prompt = `
Evaluate the originality of the following project's design:

Project Title: ${context.specification.title}

Evaluate based on:
1. Uniqueness of the visual language
2. Ratio of custom design decisions vs default UI library patterns
3. Avoidance of generic, overused AI design patterns
4. Creativity of design solutions

Penalize heavily for generic templates and default component styling.
Score from 0-100, and provide detailed feedback and improvement suggestions.
Return ONLY a JSON object with:
{
  "score": number,
  "feedback": "detailed feedback text",
  "suggestions": ["list of improvement suggestions"]
}
    `.trim();

    const response = await this.generateResponse(prompt);
    return JSON.parse(response.content);
  }

  /**
   * Evaluate craft execution dimension
   */
  private async evaluateCraftExecution(context: ProjectContext): Promise<{ score: number; feedback: string; suggestions: string[] }> {
    this.logger.info('Evaluating craft execution quality');

    const prompt = `
Evaluate the technical craft execution of the following project:

Project Title: ${context.specification.title}

Evaluate based on:
1. Spacing consistency (follows 4/8px grid system)
2. Typography hierarchy and consistency
3. Color harmony and accessibility contrast
4. Responsive design implementation
5. Code quality and adherence to best practices

Score from 0-100, and provide detailed feedback and improvement suggestions.
Return ONLY a JSON object with:
{
  "score": number,
  "feedback": "detailed feedback text",
  "suggestions": ["list of improvement suggestions"]
}
    `.trim();

    const response = await this.generateResponse(prompt);
    return JSON.parse(response.content);
  }

  /**
   * Evaluate functional usability dimension
   */
  private async evaluateFunctionalUsability(context: ProjectContext): Promise<{ score: number; feedback: string; suggestions: string[] }> {
    this.logger.info('Evaluating functional usability');

    // In a real implementation, we would run Playwright tests here to simulate user interactions

    const prompt = `
Evaluate the functional usability of the following project:

Project Title: ${context.specification.title}
Features: ${context.specification.requirements.features.join(', ')}

Evaluate based on:
1. Completeness of all required features
2. Intuitiveness of user interface and navigation
3. Error handling and feedback
4. Performance and responsiveness
5. Accessibility compliance

Score from 0-100, and provide detailed feedback and improvement suggestions.
Return ONLY a JSON object with:
{
  "score": number,
  "feedback": "detailed feedback text",
  "suggestions": ["list of improvement suggestions"]
}
    `.trim();

    const response = await this.generateResponse(prompt);
    return JSON.parse(response.content);
  }

  /**
   * Generate quality summary from individual scores
   */
  private generateQualitySummary(scores: {
    designScore: { score: number; feedback: string };
    originalityScore: { score: number; feedback: string };
    craftScore: { score: number; feedback: string };
    usabilityScore: { score: number; feedback: string };
    overallScore: number;
  }): string {
    return `
Overall Quality Score: ${scores.overallScore}/100

Design Quality: ${scores.designScore.score}/100 - ${scores.designScore.feedback}
Originality: ${scores.originalityScore.score}/100 - ${scores.originalityScore.feedback}
Craft Execution: ${scores.craftScore.score}/100 - ${scores.craftScore.feedback}
Functional Usability: ${scores.usabilityScore.score}/100 - ${scores.usabilityScore.feedback}

${scores.overallScore >= 85 ? '✅ Project meets quality standards, approved.' :
      scores.overallScore >= 60 ? '⚠️ Project needs refinement to meet quality standards.' :
        '❌ Project quality is too low, needs full redesign pivot.'}
    `.trim();
  }

  /**
   * Generate improvement points from quality scores
   */
  private generateImprovementPoints(qualityScore: QualityScore): any[] {
    const points: any[] = [];

    for (const [_dimension, score] of Object.entries(qualityScore.dimensions)) {
      if (score.score < 80) {
        score.suggestions.forEach((suggestion) => {
          points.push({
            description: suggestion,
            priority: score.score < 60 ? 'critical' : score.score < 70 ? 'high' : 'medium',
            suggestion,
          });
        });
      }
    }

    return points;
  }

  /**
   * Take screenshot of the application for visual evaluation
   */
  async takeScreenshot(url: string, outputPath: string): Promise<string> {
    if (!this.browser) {
      throw new Error('Evaluator not initialized');
    }

    const page: Page = await this.browser.newPage();
    await page.goto(url);
    await page.screenshot({ path: outputPath, fullPage: true });
    await page.close();

    return outputPath;
  }

  /**
   * Main execution method
   */
  async execute(input: {
    context: ProjectContext;
    sprintResult?: SprintResult;
    projectPath?: string;
  }): Promise<EvaluationFeedback> {
    await this.initialize(input.projectPath);
    return this.evaluateProject(input.context, input.sprintResult);
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await super.cleanup();

    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
    }
  }
}
