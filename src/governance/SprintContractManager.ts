import { Sprint } from '../types/project';
import { SprintContract, ContractFulfillmentResult, SprintContractClause } from '../types/governance';
import { agentConfig } from '../config';

export class SprintContractManager {
  constructor() {}

  /**
   * Draft a new sprint contract
   */
  async draftContract(sprint: Sprint): Promise<SprintContract> {
    const clauses: SprintContractClause[] = [];

    // Add clauses for each task
    sprint.tasks.forEach((task, index) => {
      clauses.push({
        id: `clause-task-${index + 1}`,
        description: `Implement task: ${task.title} - ${task.description}`,
        verificationMethod: `Code review and functional testing of the ${task.title} feature`,
        required: true,
      });
    });

    // Add clauses for each deliverable
    sprint.deliverables.forEach((deliverable, index) => {
      clauses.push({
        id: `clause-deliverable-${index + 1}`,
        description: `Deliver: ${deliverable}`,
        verificationMethod: `Verify ${deliverable} exists and meets specifications`,
        required: true,
      });
    });

    // Add quality clauses
    clauses.push({
      id: 'clause-quality-1',
      description: `Overall quality score >= ${agentConfig.qualityThresholds.minPassScore}/100`,
      verificationMethod: 'Automated quality evaluation by EvaluatorAgent',
      required: true,
    });

    clauses.push({
      id: 'clause-quality-2',
      description: 'All tests pass',
      verificationMethod: 'Automated test suite execution',
      required: true,
    });

    clauses.push({
      id: 'clause-quality-3',
      description: 'No critical or high severity bugs',
      verificationMethod: 'Automated bug detection and manual review',
      required: true,
    });

    return {
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
      estimatedDurationHours: sprint.tasks.reduce((sum, task) => sum + task.estimatedHours, 0),
      signedBy: {
        generator: 'GeneratorAgent',
        evaluator: 'EvaluatorAgent',
        timestamp: new Date(),
      },
    };
  }

  /**
   * Validate if the sprint result fulfills the contract
   */
  async validateContractFulfillment(
    contract: SprintContract,
    sprintResult: any,
    evaluationFeedback: any
  ): Promise<ContractFulfillmentResult> {
    const passedClauses: string[] = [];
    const failedClauses: { clauseId: string; reason: string }[] = [];

    // Check each clause
    for (const clause of contract.clauses) {
      if (!clause.required) continue;

      // In a real implementation, we would verify each clause
      // For now, we'll use the evaluation feedback to determine pass/fail
      const isPassed = this.verifyClause(clause, sprintResult, evaluationFeedback);

      if (isPassed) {
        passedClauses.push(clause.id);
      } else {
        failedClauses.push({
          clauseId: clause.id,
          reason: `Clause not met: ${clause.description}`,
        });
      }
    }

    // Check if all acceptance criteria are met
    const acceptanceCriteriaMet = failedClauses.length === 0;

    // Check quality thresholds
    const qualityThresholdsMet = evaluationFeedback.qualityScore.pass;

    // Check all deliverables are completed
    const deliverablesCompleted = sprintResult.generatedFiles || [];
    const deliverablesMissing = contract.deliverables.filter(
      d => !deliverablesCompleted.some((f: string) => f.includes(d))
    );

    const fulfilled = failedClauses.length === 0 && qualityThresholdsMet && deliverablesMissing.length === 0;

    return {
      contractId: `${contract.sprintId}-contract`,
      fulfilled,
      passedClauses,
      failedClauses,
      acceptanceCriteriaMet,
      qualityThresholdsMet,
      deliverablesCompleted,
      deliverablesMissing,
      summary: fulfilled
        ? 'All contract terms have been fulfilled successfully'
        : `Contract not fulfilled. ${failedClauses.length} failed clauses, ${deliverablesMissing.length} missing deliverables`,
    };
  }

  /**
   * Verify if a single clause is met
   */
  private verifyClause(clause: SprintContractClause, sprintResult: any, evaluationFeedback: any): boolean {
    // Simple implementation for demonstration
    if (clause.id.startsWith('clause-quality-1')) {
      const match = clause.description.match(/\d+/);
      return match ? evaluationFeedback.qualityScore.overall >= parseInt(match[0]) : true;
    }

    if (clause.id.startsWith('clause-quality-2')) {
      return sprintResult.testStatus === true;
    }

    // Assume other clauses are passed for now
    // In a real implementation, we would verify each clause individually
    return true;
  }

  /**
   * Generate a contract summary report
   */
  generateContractReport(contract: SprintContract, result: ContractFulfillmentResult): string {
    return `
# Sprint ${contract.sprintNumber} Contract Report

## Status: ${result.fulfilled ? '✅ FULFILLED' : '❌ NOT FULFILLED'}

## Summary
${result.summary}

## Clauses
Total: ${contract.clauses.length} | Passed: ${result.passedClauses.length} | Failed: ${result.failedClauses.length}

## Deliverables
Completed: ${result.deliverablesCompleted.length} | Missing: ${result.deliverablesMissing.length}

## Quality
Thresholds Met: ${result.qualityThresholdsMet ? '✅ Yes' : '❌ No'}
    `.trim();
  }
}
