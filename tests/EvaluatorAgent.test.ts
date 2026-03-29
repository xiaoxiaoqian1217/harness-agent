import { EvaluatorAgent } from '../src/agents/EvaluatorAgent';

// Mock AestheticEvaluator
jest.mock('../src/quality/AestheticEvaluator', () => ({
  AestheticEvaluator: class {
    evaluateDesignQuality() {
      return Promise.resolve({ score: 85, feedback: 'Good design', suggestions: [] });
    }
    evaluateCraftExecution() {
      return Promise.resolve({ score: 90, feedback: 'Good craft', suggestions: [] });
    }
    evaluateOriginality() {
      return Promise.resolve({ score: 80, feedback: 'Original', suggestions: [] });
    }
  },
}));

// Mock TestOrchestrator
jest.mock('../src/quality/TestOrchestrator', () => ({
  TestOrchestrator: class {
    initialize() {}
    runE2ETests() {
      return Promise.resolve([]);
    }
    captureScreenshots() {
      return Promise.resolve([]);
    }
    cleanup() {}
  },
}));

jest.mock('winston', () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

describe('EvaluatorAgent - Simplified Tests', () => {
  let agent: EvaluatorAgent;
  let mockContext: any;

  beforeEach(async () => {
    agent = new EvaluatorAgent();
    await agent.initialize();

    mockContext = {
      specification: { title: 'Test', description: 'Test' },
      projectPath: './test',
    };
  });

  afterAll(async () => {
    await agent.cleanup();
  });

  describe('evaluateProject', () => {
    test('should return quality feedback', async () => {
      const result = await agent.evaluateProject(mockContext);

      expect(result).toBeDefined();
      expect(result.qualityScore).toBeDefined();
      expect(result.qualityScore.overall).toBeGreaterThan(0);
      expect(result.qualityScore.overall).toBeLessThanOrEqual(100);
    });

    test('should determine next steps', async () => {
      const result = await agent.evaluateProject(mockContext);

      expect(['approve', 'refine', 'pivot']).toContain(result.nextSteps);
    });

    test('should include improvement points', async () => {
      const result = await agent.evaluateProject(mockContext);

      expect(Array.isArray(result.improvementPoints)).toBe(true);
      expect(result.improvementPoints.length).toBeGreaterThan(0);
    });
  });
});
