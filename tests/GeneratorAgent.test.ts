import { GeneratorAgent } from '../src/agents/GeneratorAgent';

// Mock dependencies
jest.mock('../core/GitManager');
jest.mock('fs-extra');
jest.mock('winston', () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

describe('GeneratorAgent - Simplified Tests', () => {
  let agent: GeneratorAgent;

  beforeEach(() => {
    agent = new GeneratorAgent();
  });

  describe('execute', () => {
    test('should generate files for sprint', async () => {
      const mockSprint = {
        id: 'sprint-1',
        title: 'Test Sprint',
        tasks: [{ id: 'task-1', title: 'Task 1', estimatedHours: 4, acceptanceCriteria: [] }],
        deliverables: ['src/components/Test.tsx'],
      } as any;

      const mockContext = {
        specification: { title: 'Test' },
        projectPath: './test',
      } as any;

      const result = await agent.execute({
        projectPath: './test',
        context: mockContext,
        sprint: mockSprint,
      });

      expect(result.success).toBe(true);
      expect(result.generatedFiles).toBeDefined();
      expect(result.sprintId).toBe('sprint-1');
    });

    test('should handle feedback for refinement', async () => {
      const result = await agent.execute({
        projectPath: './test',
        context: { specification: { title: 'Test' } } as any,
        feedback: 'Improve styling',
      });

      expect(result.success).toBe(true);
    });

    test('should throw when no sprint or feedback', async () => {
      await expect(
        agent.execute({
          projectPath: './test',
          context: { specification: { title: 'Test' } } as any,
        })
      ).rejects.toThrow('No sprint or feedback provided');
    });
  });

  describe('cleanup', () => {
    test('should cleanup without errors', async () => {
      await expect(agent.cleanup()).resolves.not.toThrow();
    });
  });
});
