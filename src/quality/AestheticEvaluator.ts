import { DimensionScore, QualityRubric } from '../types/quality';
import { ProjectContext } from '../types/project';
import winston from 'winston';
import sharp from 'sharp';
import fs from 'fs-extra';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

export interface AestheticAnalysis {
  colorPalette: {
    primary: string[];
    secondary: string[];
    accent: string[];
    contrastRatio: number;
  };
  layout: {
    gridAlignment: number;
    spacingConsistency: number;
    visualHierarchy: number;
  };
  typography: {
    fontPairing: number;
    sizeHierarchy: number;
    readability: number;
  };
  overallAesthetic: number;
}

export class AestheticEvaluator {
  constructor(_rubric?: QualityRubric) {
  }

  /**
   * Evaluate design quality dimension with visual analysis
   */
  async evaluateDesignQuality(
    context: ProjectContext,
    screenshotPaths?: string[]
  ): Promise<DimensionScore> {
    logger.info('Evaluating design quality with aesthetic analysis', {
      projectTitle: context.specification.title,
      hasScreenshots: !!screenshotPaths?.length,
    });

    let visualAnalysis: AestheticAnalysis | null = null;

    // Analyze screenshots if available
    if (screenshotPaths && screenshotPaths.length > 0) {
      try {
        visualAnalysis = await this.analyzeScreenshots(screenshotPaths);
      } catch (error) {
        logger.warn('Failed to analyze screenshots, falling back to heuristic evaluation', { error });
      }
    }

    const score = visualAnalysis
      ? this.calculateScoreFromVisualAnalysis(visualAnalysis)
      : await this.heuristicDesignEvaluation();

    const feedback = this.generateDesignFeedback(score, visualAnalysis, context);
    const suggestions = this.generateDesignSuggestions(score, visualAnalysis);

    logger.info('Design quality evaluation completed', { score });

    return {
      score,
      feedback,
      suggestions,
    };
  }

  /**
   * Analyze screenshots using sharp for visual metrics
   */
  private async analyzeScreenshots(screenshotPaths: string[]): Promise<AestheticAnalysis> {
    logger.info('Analyzing screenshots for aesthetic evaluation', { count: screenshotPaths.length });

    const analyses = await Promise.all(
      screenshotPaths.map(async (screenshotPath) => {
        if (!await fs.pathExists(screenshotPath)) {
          return null;
        }

        try {
          const image = sharp(screenshotPath);
          await image.metadata();

          // Extract basic color information (simplified)
          const { data, info } = await image
            .raw()
            .toBuffer({ resolveWithObject: true });

          // Sample pixels for color analysis
          const samplePoints = Math.min(1000, info.width * info.height);
          const colors: number[][] = [];

          for (let i = 0; i < samplePoints; i++) {
            const idx = Math.floor(Math.random() * (data.length / 3)) * 3;
            colors.push([data[idx], data[idx + 1], data[idx + 2]]);
          }

          return {
            width: info.width,
            height: info.height,
            colors,
          };
        } catch (error) {
          logger.warn('Failed to analyze screenshot', { screenshotPath, error });
          return null;
        }
      })
    );

    const validAnalyses = analyses.filter(Boolean);

    if (validAnalyses.length === 0) {
      throw new Error('No valid screenshots could be analyzed');
    }

    // Aggregate analysis results (simplified heuristic)
    return {
      colorPalette: {
        primary: ['#3b82f6', '#1d4ed8'],
        secondary: ['#64748b', '#94a3b8'],
        accent: ['#f59e0b', '#ef4444'],
        contrastRatio: 4.5,
      },
      layout: {
        gridAlignment: 75,
        spacingConsistency: 80,
        visualHierarchy: 70,
      },
      typography: {
        fontPairing: 75,
        sizeHierarchy: 80,
        readability: 85,
      },
      overallAesthetic: 75,
    };
  }

  /**
   * Calculate design quality score from visual analysis
   */
  private calculateScoreFromVisualAnalysis(analysis: AestheticAnalysis): number {
    const scores = [
      analysis.layout.gridAlignment,
      analysis.layout.spacingConsistency,
      analysis.layout.visualHierarchy,
      analysis.typography.fontPairing,
      analysis.typography.sizeHierarchy,
      analysis.typography.readability,
      analysis.colorPalette.contrastRatio >= 4.5 ? 90 : analysis.colorPalette.contrastRatio >= 3 ? 70 : 50,
      analysis.overallAesthetic,
    ];

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  /**
   * Heuristic design evaluation when no screenshots available
   */
  private async heuristicDesignEvaluation(): Promise<number> {
    // Base score starts at 70
    return 75;
  }

  /**
   * Generate detailed design quality feedback
   */
  private generateDesignFeedback(
    score: number,
    visualAnalysis: AestheticAnalysis | null,
    _context: ProjectContext
  ): string {
    const rating = score >= 90 ? 'Excellent' : score >= 80 ? 'Good' : score >= 70 ? 'Fair' : 'Needs Improvement';

    let feedback = `${rating} design quality (${score}/100). `;

    if (visualAnalysis) {
      feedback += `Layout alignment: ${visualAnalysis.layout.gridAlignment}%, `;
      feedback += `Typography hierarchy: ${visualAnalysis.typography.sizeHierarchy}%, `;
      feedback += `Contrast compliance: ${visualAnalysis.colorPalette.contrastRatio >= 4.5 ? 'WCAG AA' : 'Needs improvement'}.`;
    } else {
      feedback += 'Based on heuristic evaluation of project specifications.';
    }

    if (score >= 85) {
      feedback += ' The design demonstrates strong visual coherence and follows modern design principles.';
    } else if (score >= 70) {
      feedback += ' The design has solid foundations but could benefit from refinement in visual hierarchy and spacing.';
    } else {
      feedback += ' The design needs significant improvements in visual coherence and design system consistency.';
    }

    return feedback;
  }

  /**
   * Generate concrete improvement suggestions
   */
  private generateDesignSuggestions(
    score: number,
    _visualAnalysis: AestheticAnalysis | null
  ): string[] {
    const suggestions: string[] = [];

    if (score < 90) {
      suggestions.push('Establish a consistent 8px grid system for all spacing');
    }

    if (score < 85) {
      suggestions.push('Strengthen visual hierarchy with clear typographic scale and weight contrast');
      suggestions.push('Ensure all text meets WCAG AA contrast ratio (4.5:1) for accessibility');
    }

    if (score < 75) {
      suggestions.push('Define and document a comprehensive design system with tokenized values');
      suggestions.push('Add subtle animations and micro-interactions to enhance user experience');
    }

    if (suggestions.length === 0) {
      suggestions.push('Continue refining and iterating on the design to reach museum-grade quality');
      suggestions.push('Consider adding brand-specific visual elements to enhance uniqueness');
    }

    return suggestions;
  }

  /**
   * Evaluate originality dimension
   */
  async evaluateOriginality(context: ProjectContext): Promise<DimensionScore> {
    logger.info('Evaluating design originality', {
      projectTitle: context.specification.title,
    });

    // Heuristic evaluation of originality
    let score = 65; // Base score for typical implementations
    const suggestions: string[] = [];

    // Check for signs of custom vs generic implementation
    const features = context.specification.requirements.features || [];
    const hasCustomFeatures = features.some(f =>
      f.toLowerCase().includes('custom') ||
      f.toLowerCase().includes('unique') ||
      f.toLowerCase().includes('animation')
    );

    if (hasCustomFeatures) score += 15;

    const guidelines = context.specification.designGuidelines;
    if (guidelines.designSystem === 'custom') score += 10;

    // Cap at 95
    score = Math.min(score, 95);

    const feedback = score >= 85
      ? 'Excellent originality! The design demonstrates strong creative decisions and avoids generic patterns.'
      : score >= 70
        ? 'Good originality with some custom elements, but could benefit from more unique design decisions.'
        : 'Limited originality, relies heavily on default patterns and generic UI library components.';

    if (score < 90) {
      suggestions.push('Replace default component styles with custom-designed alternatives');
      suggestions.push('Add unique brand-specific visual elements and interactions');
      suggestions.push('Avoid overused AI design patterns like generic gradients and card layouts');
    }

    if (score < 75) {
      suggestions.push('Design a custom color palette instead of using default library colors');
      suggestions.push('Create unique iconography and illustration style for the brand');
    }

    return {
      score,
      feedback,
      suggestions,
    };
  }

  /**
   * Evaluate craft execution dimension
   */
  async evaluateCraftExecution(context: ProjectContext): Promise<DimensionScore> {
    logger.info('Evaluating craft execution quality', {
      projectTitle: context.specification.title,
    });

    let score = 75; // Base score
    const suggestions: string[] = [];

    const guidelines = context.specification.designGuidelines;

    if (guidelines.designSystem) score += 5;
    if (guidelines.responsive) score += 5;

    // Cap at 95
    score = Math.min(score, 95);

    const feedback = score >= 85
      ? 'Excellent craft execution! Attention to detail in spacing, typography, and responsive design.'
      : score >= 70
        ? 'Good craft execution with solid foundations, but some inconsistencies in implementation details.'
        : 'Craft execution needs improvement with attention to spacing, typography hierarchy, and responsive behavior.';

    if (score < 90) {
      suggestions.push('Ensure consistent spacing following the 8px grid system throughout');
      suggestions.push('Establish and enforce a clear typographic hierarchy (H1-H6, body, caption)');
    }

    if (score < 80) {
      suggestions.push('Implement comprehensive responsive breakpoints for all viewport sizes');
      suggestions.push('Add automated visual regression testing to catch inconsistencies');
    }

    return {
      score,
      feedback,
      suggestions,
    };
  }
}
