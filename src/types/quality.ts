import { z } from 'zod';

export const QualityDimensionSchema = z.enum([
  'designQuality',
  'originality',
  'craftExecution',
  'functionalUsability',
]);
export type QualityDimension = z.infer<typeof QualityDimensionSchema>;

export const DimensionScoreSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string(),
  suggestions: z.array(z.string()),
});
export type DimensionScore = z.infer<typeof DimensionScoreSchema>;

export const QualityScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  dimensions: z.record(QualityDimensionSchema, DimensionScoreSchema),
  pass: z.boolean(),
  needsPivot: z.boolean(),
  summary: z.string(),
});
export type QualityScore = z.infer<typeof QualityScoreSchema>;

export const TestResultSchema = z.object({
  testName: z.string(),
  testType: z.enum(['unit', 'integration', 'e2e', 'api', 'performance', 'security']),
  success: z.boolean(),
  durationMs: z.number(),
  error: z.string().optional(),
  screenshotPath: z.string().optional(),
});
export type TestResult = z.infer<typeof TestResultSchema>;

export const EvaluationFeedbackSchema = z.object({
  qualityScore: QualityScoreSchema,
  testResults: z.array(TestResultSchema),
  generalFeedback: z.string(),
  improvementPoints: z.array(z.object({
    description: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    suggestion: z.string(),
  })),
  nextSteps: z.enum(['approve', 'refine', 'pivot']),
});
export type EvaluationFeedback = z.infer<typeof EvaluationFeedbackSchema>;

export const EvaluationResultSchema = z.object({
  success: z.boolean(),
  feedback: EvaluationFeedbackSchema,
  artifacts: z.object({
    screenshots: z.array(z.string()),
    reports: z.array(z.string()),
    metrics: z.record(z.string(), z.any()),
  }),
});
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

export const IterationResultSchema = z.object({
  iterationNumber: z.number(),
  sprintId: z.string(),
  qualityScore: QualityScoreSchema,
  feedback: EvaluationFeedbackSchema,
  changes: z.array(z.string()),
  durationMs: z.number(),
});
export type IterationResult = z.infer<typeof IterationResultSchema>;

export const QualityRubricSchema = z.object({
  weights: z.record(QualityDimensionSchema, z.number().min(0).max(1)),
  passThreshold: z.number().min(0).max(100).default(85),
  pivotThreshold: z.number().min(0).max(100).default(60),
  scoringGuidelines: z.record(QualityDimensionSchema, z.array(z.string())),
});
export type QualityRubric = z.infer<typeof QualityRubricSchema>;
