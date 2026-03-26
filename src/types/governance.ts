import { z } from 'zod';
import { SprintSchema } from './project';

export const SprintContractClauseSchema = z.object({
  id: z.string(),
  description: z.string(),
  verificationMethod: z.string(),
  required: z.boolean().default(true),
});
export type SprintContractClause = z.infer<typeof SprintContractClauseSchema>;

export const SprintContractSchema = z.object({
  sprintId: z.string(),
  sprintNumber: z.number(),
  title: z.string(),
  description: z.string(),
  clauses: z.array(SprintContractClauseSchema),
  acceptanceCriteria: z.array(z.string()),
  qualityThresholds: z.object({
    minimumOverallScore: z.number().min(0).max(100),
    minimumDimensionScores: z.record(z.string(), z.number().min(0).max(100)),
    testCoverageThreshold: z.number().min(0).max(100),
  }),
  deliverables: z.array(z.string()),
  estimatedDurationHours: z.number(),
  signedBy: z.object({
    generator: z.string(),
    evaluator: z.string(),
    timestamp: z.date(),
  }),
});
export type SprintContract = z.infer<typeof SprintContractSchema>;

export const ContractFulfillmentResultSchema = z.object({
  contractId: z.string(),
  fulfilled: z.boolean(),
  passedClauses: z.array(z.string()),
  failedClauses: z.array(z.object({
    clauseId: z.string(),
    reason: z.string(),
  })),
  acceptanceCriteriaMet: z.boolean(),
  qualityThresholdsMet: z.boolean(),
  deliverablesCompleted: z.array(z.string()),
  deliverablesMissing: z.array(z.string()),
  summary: z.string(),
});
export type ContractFulfillmentResult = z.infer<typeof ContractFulfillmentResultSchema>;

export const ClaudeMdSpecSchema = z.object({
  path: z.string(),
  level: z.enum(['root', 'directory', 'module']),
  content: z.string(),
  rules: z.array(z.object({
    id: z.string(),
    description: z.string(),
    enforcement: z.enum(['strict', 'warning', 'informational']),
  })),
  lastUpdated: z.date(),
});
export type ClaudeMdSpec = z.infer<typeof ClaudeMdSpecSchema>;

export const ComplianceCheckResultSchema = z.object({
  specPath: z.string(),
  compliant: z.boolean(),
  violations: z.array(z.object({
    ruleId: z.string(),
    file: z.string(),
    line: z.number().optional(),
    description: z.string(),
    severity: z.enum(['error', 'warning', 'info']),
  })),
  summary: z.string(),
});
export type ComplianceCheckResult = z.infer<typeof ComplianceCheckResultSchema>;

export const CompressedContextSchema = z.object({
  originalSizeTokens: z.number(),
  compressedSizeTokens: z.number(),
  compressionRatio: z.number(),
  content: z.string(),
  preservedElements: z.array(z.string()),
  discardedElements: z.array(z.string()),
});
export type CompressedContext = z.infer<typeof CompressedContextSchema>;

export const StateTransferDocumentSchema = z.object({
  projectId: z.string(),
  version: z.string(),
  timestamp: z.date(),
  projectSpecification: z.any(),
  currentProgress: z.object({
    completedSprints: z.array(z.string()),
    currentSprint: z.any(),
    iterationCount: z.number(),
    qualityHistory: z.array(z.any()),
  }),
  keyDecisions: z.array(z.object({
    decision: z.string(),
    context: z.string(),
    timestamp: z.date(),
  })),
  pendingTasks: z.array(z.string()),
  openIssues: z.array(z.string()),
  nextSteps: z.array(z.string()),
});
export type StateTransferDocument = z.infer<typeof StateTransferDocumentSchema>;
