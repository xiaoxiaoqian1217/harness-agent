import { Sprint } from '../types/project';
import { SprintContract, ContractFulfillmentResult } from '../types/governance';
import { EvaluationFeedback } from '../types/quality';
import { agentConfig } from '../config';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

export class SprintContractManager {
  private activeContracts: Map<string, SprintContract> = new Map();
  private contractHistory: Map<string, ContractFulfillmentResult[]> = new Map();

  constructor() {}

  /**
   * Draft a sprint contract
   */
  async draftContract(sprint: Sprint): Promise<SprintContract> {
    logger.info('Drafting sprint contract', {
      sprintNumber: sprint.sprintNumber,
      title: sprint.title,
    });

    const clauses: any[] = [];

    // Task clauses
    sprint.tasks.forEach((task, idx) => {
      clauses.push({
        id: `task-${idx + 1}`,
        description: `Implement: ${task.title}`,
        verificationMethod: 'Code review and testing',
        required: true,
      });
    });

    // Deliverable clauses
    sprint.deliverables.forEach((del, idx) => {
      clauses.push({
        id: `deliverable-${idx + 1}`,
        description: `Deliver: ${del}`,
        verificationMethod: `Verify ${del} exists`,
        required: true,
      });
    });

    // Quality clauses
    clauses.push({
      id: 'quality-pass',
      description: `Quality score >= ${agentConfig.qualityThresholds.minPassScore}/100`,
      verificationMethod: 'Evaluator assessment',
      required: true,
    });

    clauses.push({
      id: 'tests-pass',
      description: 'All tests pass',
      verificationMethod: 'Test execution',
      required: true,
    });

    const contract: SprintContract = {
      sprintId: sprint.id,
      sprintNumber: sprint.sprintNumber,
      title: sprint.title,
      description: sprint.description,
      clauses,
      acceptanceCriteria: sprint.tasks.flatMap(t => t.acceptanceCriteria),
      qualityThresholds: {
        minimumOverallScore: agentConfig.qualityThresholds.minPassScore,
        minimumDimensionScores: {
          designQuality: 70,
          originality: 70,
          craftExecution: 70,
          functionalUsability: 70,
        },
        testCoverageThreshold: 80,
      },
      deliverables: sprint.deliverables,
      estimatedDurationHours: sprint.tasks.reduce((sum, t) => sum + t.estimatedHours, 0),
      signing: {
        signedBy: {},
        signingTime: undefined,
      },
      status: 'draft',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.activeContracts.set(sprint.id, contract);

    return contract;
  }

  /**
   * Sign contract
   */
  async signContract(
    contractId: string,
    signer: 'generator' | 'evaluator',
    signatureData?: Record<string, any>
  ): Promise<void> {
    const contract = this.activeContracts.get(contractId);
    if (!contract) throw new Error(`Contract not found: ${contractId}`);

    (contract.signing.signedBy as any)[signer] = {
      timestamp: new Date(),
      signatureData,
    };

    contract.updatedAt = new Date();
  }

  /**
   * Validate fulfillment
   */
  async validateContractFulfillment(
    contractId: string,
    sprintResult: any,
    evaluationFeedback: EvaluationFeedback
  ): Promise<ContractFulfillmentResult> {
    const contract = this.activeContracts.get(contractId);
    if (!contract) throw new Error(`Contract not found: ${contractId}`);

    const passedClauses: string[] = [];
    const failedClauses: { clauseId: string; reason: string; severity: 'critical' | 'high' | 'medium' | 'low' }[] = [];

    // Check clauses
    for (const clause of contract.clauses) {
      if (!clause.required) continue;

      const validation = this.verifyClause(clause, sprintResult, evaluationFeedback);
      if (validation.passed) {
        passedClauses.push(clause.id);
      } else {
        failedClauses.push({
          clauseId: clause.id,
          reason: validation.reason!,
          severity: this.getSeverity(clause.id),
        });
      }
    }

    // Check quality
    const qualityScore = evaluationFeedback.qualityScore.overall;
    const qualityMet = qualityScore >= contract.qualityThresholds.minimumOverallScore;

    if (!qualityMet) {
      failedClauses.push({
        clauseId: 'quality-overall',
        reason: `Quality score ${qualityScore} < ${contract.qualityThresholds.minimumOverallScore}`,
        severity: 'critical',
      });
    }

    // Check deliverables
    const completed: string[] = [];
    const missing: string[] = [];

    for (const deliverable of contract.deliverables) {
      const found = sprintResult.generatedFiles?.some((f: string) =>
        f.toLowerCase().includes(deliverable.toLowerCase().split(' ')[0])
      );
      found ? completed.push(deliverable) : missing.push(deliverable);
    }

    // Determine fulfillment
    const criticalFails = failedClauses.filter(f => f.severity === 'critical').length;
    const fulfilled = criticalFails === 0 && qualityMet && missing.length === 0;

    const result: ContractFulfillmentResult = {
      contractId,
      fulfilled,
      passedClauses,
      failedClauses,
      acceptanceCriteriaMet: passedClauses.length === contract.clauses.filter(c => c.required).length,
      qualityThresholdsMet: qualityMet,
      deliverablesCompleted: completed,
      deliverablesMissing: missing,
      summary: this.generateSummary(contract, fulfilled, passedClauses, failedClauses, qualityScore, missing),
      validatedAt: new Date(),
      metrics: {
        totalClauses: contract.clauses.filter(c => c.required).length,
        passedCount: passedClauses.length,
        failedCount: failedClauses.length,
        qualityScore,
        deliverablesCompleteness: completed.length / contract.deliverables.length,
      },
    };

    // Store history
    const history = this.contractHistory.get(contractId) || [];
    history.push(result);
    this.contractHistory.set(contractId, history);

    // Update contract
    contract.status = fulfilled ? 'fulfilled' : 'breached';
    contract.updatedAt = new Date();

    return result;
  }

  /**
   * Verify single clause
   */
  private verifyClause(clause: any, sprintResult: any, evaluationFeedback: EvaluationFeedback): {
    passed: boolean;
    reason?: string;
  } {
    // Quality clause
    if (clause.id.includes('quality')) {
      const score = evaluationFeedback.qualityScore.overall;
      const pass = score >= agentConfig.qualityThresholds.minPassScore;
      return {
        passed: pass,
        reason: pass ? undefined : `Quality score ${score} below threshold`,
      };
    }

    // Test clause
    if (clause.id.includes('test') || clause.description.includes('test')) {
      const pass = sprintResult.testStatus === true;
      return { passed: pass, reason: pass ? undefined : 'Tests failed' };
    }

    // Task/Deliverable - assume pass if sprint succeeded
    return { passed: true };
  }

  /**
   * Get severity for failed clause
   */
  private getSeverity(clauseId: string): 'critical' | 'high' | 'medium' | 'low' {
    if (clauseId.includes('quality') || clauseId.includes('test')) return 'critical';
    if (clauseId.includes('task')) return 'high';
    return 'medium';
  }

  /**
   * Generate summary
   */
  private generateSummary(
    contract: SprintContract,
    fulfilled: boolean,
    passedClauses: string[],
    failedClauses: { clauseId: string; reason: string; severity: string }[],
    qualityScore: number,
    missing: string[]
  ): string {
    const lines: string[] = [];

    lines.push(`Sprint ${contract.sprintNumber}: ${fulfilled ? '✅ FULFILLED' : '❌ BREACHED'}`);
    lines.push(`Quality Score: ${qualityScore}/100`);
    lines.push(`Clauses: ${passedClauses.length}/${contract.clauses.filter(c => c.required).length} passed`);
    lines.push(`Deliverables: ${contract.deliverables.length - missing.length}/${contract.deliverables.length} completed`);

    if (failedClauses.length > 0) {
      lines.push('\nFailed:');
      failedClauses.forEach(f => lines.push(`  [${f.severity}] ${f.reason}`));
    }

    if (missing.length > 0) {
      lines.push('\nMissing:');
      missing.forEach(m => lines.push(`  - ${m}`));
    }

    return lines.join('\n');
  }

  /**
   * Generate report
   */
  generateContractReport(contract: SprintContract, result: ContractFulfillmentResult): string {
    return `
# Sprint ${contract.sprintNumber} Contract Report

Status: ${result.fulfilled ? '✅ FULFILLED' : '❌ BREACHED'}
Generated: ${result.validatedAt.toISOString()}

${result.summary}

## Metrics
- Quality Score: ${result.metrics.qualityScore}/100
- Clauses: ${result.metrics.passedCount}/${result.metrics.totalClauses} passed (${Math.round(result.metrics.passedCount / result.metrics.totalClauses * 100)}%)
- Deliverables: ${result.deliverablesCompleted.length}/${contract.deliverables.length} completed

## Recommendations
${this.generateRecommendations(result)}
    `.trim();
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(result: ContractFulfillmentResult): string {
    const recs: string[] = [];

    if (!result.qualityThresholdsMet) {
      recs.push('Improve quality scores based on evaluator feedback');
    }

    if (result.deliverablesMissing.length > 0) {
      recs.push(`Complete missing: ${result.deliverablesMissing.join(', ')}`);
    }

    if (recs.length === 0) {
      recs.push('Excellent work! Maintain current quality standards.');
    }

    return recs.join('\n');
  }

  /**
   * Get contract
   */
  getActiveContract(contractId: string): SprintContract | undefined {
    return this.activeContracts.get(contractId);
  }

  /**
   * Get history
   */
  getContractHistory(contractId: string): ContractFulfillmentResult[] {
    return this.contractHistory.get(contractId) || [];
  }

  /**
   * List all active contracts
   */
  listActiveContracts(): SprintContract[] {
    return Array.from(this.activeContracts.values());
  }

  /**
   * Archive contract
   */
  archiveContract(contractId: string): boolean {
    return this.activeContracts.delete(contractId);
  }

  /**
   * Clear all (testing)
   */
  clearAll(): void {
    this.activeContracts.clear();
    this.contractHistory.clear();
  }
}
