import { PlannerAgent } from '../src/agents/PlannerAgent';

// Mock BaseAgent
jest.mock('./BaseAgent', () => {
  return {
    BaseAgent: class {
      async generateResponse(prompt: string): Promise<{ content: string; success: boolean; error?: string }> {
        if (prompt.includes('technology stack')) {
          return { content: JSON.stringify({ frontend: 'react-vite', backend: 'node-express', database: 'sqlite' }), success: true };
        }
        if (prompt.includes('structured format')) {
          return { content: JSON.stringify({ title: 'Test Project', features: ['Feature A'] }), success: true };
        }
        if (prompt.includes('plan') || prompt.includes('sprint')) {
          return { content: JSON.stringify({ sprints: [{ tasks: [], deliverables: [] }], totalEstimatedHours: 10 }), success: true };
        }
        return { content: '{}', success: true };
      }
    },
  };
});

jest.mock('winston', () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

describe('PlannerAgent - Simplified Tests', () => {
  let agent: PlannerAgent;

  beforeEach(() => {
    agent = new PlannerAgent();
  });

  describe('analyzeRequirements', () => {
    test('should parse requirements', async () => {
      const result = await agent.analyzeRequirements('Build a web app');

      expect(result).toBeDefined();
      expect(result.features).toBeDefined();
    });

    test('should throw when LLM returns failure', async () => {
      const agent = new PlannerAgent();
      jest.spyOn(agent as any, 'generateResponse').mockResolvedValue({
        success: false,
        content: '',
        error: 'API Error: 404 Not Found'
      });

      await expect(agent.analyzeRequirements('Build a web app'))
        .rejects.toThrow('Failed to analyze requirements: API Error: 404 Not Found');
    });
  });

  describe('recommendTechStack', () => {
    test('should return tech stack recommendations', async () => {
      const result = await agent.recommendTechStack({ rawDescription: 'Test', features: [] } as any);

      expect(result.frontend).toBe('react-vite');
      expect(result.backend).toBe('node-express');
    });

    test('should throw when LLM returns failure', async () => {
      const agent = new PlannerAgent();
      jest.spyOn(agent as any, 'generateResponse').mockResolvedValue({
        success: false,
        content: '',
        error: 'Rate limit exceeded'
      });

      await expect(agent.recommendTechStack({ rawDescription: 'Test', features: [] } as any))
        .rejects.toThrow('Failed to recommend tech stack: Rate limit exceeded');
    });
  });

  describe('createProjectSpecification', () => {
    test('should create specification', async () => {
      const techStack = { frontend: 'react-vite', backend: 'node-express', database: 'sqlite' } as any;
      const result = await agent.createProjectSpecification({ rawDescription: 'Test', features: [] } as any, techStack);

      expect(result).toBeDefined();
      expect(result.techStack).toEqual(techStack);
    });

    test('should throw when LLM returns failure', async () => {
      const agent = new PlannerAgent();
      jest.spyOn(agent as any, 'generateResponse').mockResolvedValue({
        success: false,
        content: '',
        error: 'Connection timeout'
      });

      const techStack = { frontend: 'react-vite' } as any;
      await expect(agent.createProjectSpecification({} as any, techStack))
        .rejects.toThrow('Failed to create project specification: Connection timeout');
    });
  });

  describe('createProjectPlan', () => {
    test('should create project plan', async () => {
      const spec = {
        title: 'Test',
        description: 'Test project',
        requirements: {},
        techStack: {},
        architecture: { isSeparateFrontendBackend: false, components: [], dataFlow: '' },
        designGuidelines: { colorScheme: '', typography: '', designSystem: '', responsive: false }
      } as any;
      const result = await agent.createProjectPlan(spec);

      expect(result).toBeDefined();
      expect(result.totalSprints).toBeGreaterThan(0);
    });

    test('should throw when LLM returns failure', async () => {
      const agent = new PlannerAgent();
      jest.spyOn(agent as any, 'generateResponse').mockResolvedValue({
        success: false,
        content: '',
        error: 'Server error 500'
      });

      const spec = {
        title: 'Test',
        description: 'Test project',
        requirements: {},
        techStack: {},
        architecture: { isSeparateFrontendBackend: false, components: [], dataFlow: '' },
        designGuidelines: { colorScheme: '', typography: '', designSystem: '', responsive: false }
      } as any;
      await expect(agent.createProjectPlan(spec))
        .rejects.toThrow('Failed to create project plan: Server error 500');
    });
  });

  describe('execute', () => {
    test('should complete successfully', async () => {
      const result = await agent.execute({ requirement: 'Build an app' });

      expect(result.success).toBe(true);
    });

    test('should handle errors', async () => {
      const agent = new PlannerAgent();
      jest.spyOn(agent as any, 'analyzeRequirements').mockRejectedValue(new Error('API Error'));

      const result = await agent.execute({ requirement: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
