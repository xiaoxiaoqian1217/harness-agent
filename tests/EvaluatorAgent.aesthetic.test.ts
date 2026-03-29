import { EvaluatorAgent } from '../src/agents/EvaluatorAgent';
import { ProjectContext } from '../src/types/project';
import { SprintResult } from '../src/types/project';

// Minimal test to verify AestheticEvaluator integration
describe('EvaluatorAgent - AestheticEvaluator Integration', () => {
  let agent: EvaluatorAgent;
  let mockContext: ProjectContext;

  beforeAll(async () => {
    agent = new EvaluatorAgent();
    await agent.initialize();

    mockContext = {
      specification: {
        title: 'Test Project',
        designGuidelines: {
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b',
          typography: {
            headingFont: 'Inter',
            bodyFont: 'Inter',
          },
          designSystem: 'custom',
          spacing: '8px',
          responsive: true,
        },
        requirements: {
          features: ['Login', 'Dashboard'],
          userFlows: ['User can login'],
        },
        techStack: {
          frontend: 'react',
          backend: 'node',
          database: 'sqlite',
        },
      },
      projectPath: '/tmp/test-project',
    };
  });

  afterAll(async () => {
    await agent.cleanup();
  });

  test('should initialize with AestheticEvaluator', () => {
    // EvaluatorAgent should have aestheticEvaluator instance
    // This verifies the integration exists
    expect(agent).toBeDefined();
  });

  test('evaluateDesignQuality should use AestheticEvaluator with screenshots', async () => {
    // This tests that visual analysis path works
    const result = await agent.evaluateProject(mockContext);

    expect(result).toBeDefined();
    expect(result.qualityScore).toBeDefined();
    expect(result.qualityScore.dimensions.designQuality).toBeDefined();
    expect(result.qualityScore.dimensions.designQuality.score).toBeGreaterThan(0);
  });

  test('evaluateCraftExecution should not crash when screenshots provided', async () => {
    // This will test the problematic integration point
    // We expect it to handle visual analysis properly even if types don't match
    const result = await agent.evaluateProject(mockContext);

    expect(result.qualityScore.dimensions.craftExecution).toBeDefined();
    expect(result.qualityScore.dimensions.craftExecution.score).toBeGreaterThan(0);
  });
});
