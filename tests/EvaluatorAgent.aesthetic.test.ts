import { EvaluatorAgent } from '../src/agents/EvaluatorAgent';

// Set env vars
process.env.PLANNER_TEMPERATURE = '0.1';
process.env.GENERATOR_TEMPERATURE = '0.7';
process.env.EVALUATOR_TEMPERATURE = '0.3';
process.env.MIN_PASS_SCORE = '85';
process.env.PIVOT_THRESHOLD = '60';
process.env.MAX_ITERATIONS = '5';
process.env.PLAYWRIGHT_HEADLESS = 'true';

// Mock AestheticEvaluator
jest.mock('../src/quality/AestheticEvaluator', () => ({
  AestheticEvaluator: class {
    evaluateDesignQuality() {
      return Promise.resolve({ score: 85, feedback: 'Good design', suggestions: [] });
    }
    evaluateCraftExecution() {
      return Promise.resolve({ score: 90, feedback: 'Good craft', suggestions: [] });
    }
  },
}));

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

describe('EvaluatorAgent Aesthetic Integration', () => {
  let agent: EvaluatorAgent;

  beforeAll(async () => {
    agent = new EvaluatorAgent();
    await agent.initialize();
  });

  afterAll(async () => {
    await agent.cleanup();
  });

  test('should evaluate with visual analysis', async () => {
    const context = { specification: { title: 'Test' }, projectPath: './test' } as any;
    const result = await agent.evaluateProject(context);

    expect(result.qualityScore.overall).toBeGreaterThan(80);
  });
});
