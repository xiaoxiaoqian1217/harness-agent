import { AdversarialLoop } from '../src/quality/AdversarialLoop';
import type { GeneratorAgent, EvaluatorAgent } from '../src/agents';
import type { Sprint, ProjectContext } from '../src/types/project';

// Simplified mocks
const mockGenerator = {
  execute: jest.fn(),
  cleanup: jest.fn(),
} as any;

const mockEvaluator = {
  execute: jest.fn(),
  cleanup: jest.fn(),
} as any;

describe('AdversarialLoop - Simplified Tests', () => {
  let loop: AdversarialLoop;
  let mockSprint: Sprint;
  let mockContext: ProjectContext;

  beforeEach(() => {
    loop = new AdversarialLoop(mockGenerator, mockEvaluator, {
      maxIterations: 3,
      passThreshold: 85,
      pivotThreshold: 60,
    });

    mockSprint = {
      id: 'sprint-1',
      sprintNumber: 1,
      title: 'Test Sprint',
      description: 'Test',
      tasks: [],
      deliverables: [],
      durationDays: 1,
    } as any;

    mockContext = {
      specification: { title: 'Test', description: 'Test' },
      projectPath: './test',
    } as any;

    jest.clearAllMocks();
  });

  describe('runSprintLoop', () => {
    test('should iterate until pass threshold is met', async () => {
      mockGenerator.execute
        .mockResolvedValue({
          sprintId: 'sprint-1',
          success: true,
          generatedFiles: ['file1.ts'],
          gitCommitHash: 'abc123',
          buildStatus: true,
          testStatus: true,
        })
        .mockResolvedValue({
          sprintId: 'sprint-1',
          success: true,
          generatedFiles: ['file1.ts', 'file2.ts'],
          gitCommitHash: 'def456',
          buildStatus: true,
          testStatus: true,
        });

      mockEvaluator.execute
        .mockResolvedValue({
          overall: 70,
          dimensions: {},
          nextSteps: 'refine',
          generalFeedback: 'Needs improvement',
          improvementPoints: [{ description: 'Fix styling', priority: 'high' }],
        })
        .mockResolvedValue({
          overall: 90,
          dimensions: {},
          nextSteps: 'approve',
          generalFeedback: 'Good',
          improvementPoints: [],
        });

      const results = await loop.runSprintLoop(mockSprint, mockContext, './test');

      expect(results.length).toBe(2);
      expect(results[1].feedback.nextSteps).toBe('approve');
    });

    test('should stop when generator fails', async () => {
      mockGenerator.execute.mockResolvedValue({
        sprintId: 'sprint-1',
        success: false,
        errors: ['Build failed'],
      });

      const results = await loop.runSprintLoop(mockSprint, mockContext, './test');

      expect(results.length).toBe(0);
    });

    test('should respect max iterations', async () => {
      mockGenerator.execute.mockResolvedValue({
        sprintId: 'sprint-1',
        success: true,
        generatedFiles: [],
        gitCommitHash: 'abc',
        buildStatus: true,
        testStatus: true,
      });

      mockEvaluator.execute.mockResolvedValue({
        overall: 50,
        dimensions: {},
        nextSteps: 'refine',
        generalFeedback: 'Keep trying',
        improvementPoints: [],
      });

      const results = await loop.runSprintLoop(mockSprint, mockContext, './test');

      expect(results.length).toBe(3); // max iterations
    });
  });

  describe('runFullProjectLoop', () => {
    test('should run multiple sprints', async () => {
      const sprints = [
        { ...mockSprint, id: 'sprint-1', sprintNumber: 1 },
        { ...mockSprint, id: 'sprint-2', sprintNumber: 2 },
      ] as any;

      mockGenerator.execute.mockResolvedValue({
        sprintId: 'any',
        success: true,
        generatedFiles: [],
        gitCommitHash: 'abc',
        buildStatus: true,
        testStatus: true,
      });

      mockEvaluator.execute.mockResolvedValue({
        overall: 90,
        dimensions: {},
        nextSteps: 'approve',
        generalFeedback: 'Good',
        improvementPoints: [],
      });

      const projectResults = await loop.runFullProjectLoop(sprints, mockContext, './test');

      expect(projectResults).toHaveLength(2);
    });
  });
});
