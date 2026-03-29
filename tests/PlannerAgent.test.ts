import { PlannerAgent } from '../src/agents/PlannerAgent';

// Simple test to verify error handling: when LLM returns failure response,
// Planner should throw the actual error, not "Unexpected end of JSON input"
describe('PlannerAgent Error Handling', () => {
  let agent: PlannerAgent;

  beforeEach(async () => {
    agent = new PlannerAgent();
    // Don't actually initialize, just set up a fake LLM client
    (agent as any).llmClient = {
      generateResponse: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('analyzeRequirements should throw actual API error when LLM fails', async () => {
    // Mock a failed LLM response (empty content, error message)
    (agent as any).llmClient.generateResponse = jest.fn().mockResolvedValue({
      success: false,
      content: '',
      error: 'Qwen API error: 404 Not Found'
    });

    await expect(agent.analyzeRequirements('test')).rejects.toThrow(
      'Failed to analyze requirements: Qwen API error: 404 Not Found'
    );
  });

  it('recommendTechStack should throw actual API error when LLM fails', async () => {
    (agent as any).llmClient.generateResponse = jest.fn().mockResolvedValue({
      success: false,
      content: '',
      error: 'Connection timeout'
    });

    await expect(agent.recommendTechStack({ rawDescription: 'test', features: [] } as any))
      .rejects.toThrow('Failed to recommend tech stack: Connection timeout');
  });

  it('createProjectSpecification should throw actual API error when LLM fails', async () => {
    (agent as any).llmClient.generateResponse = jest.fn().mockResolvedValue({
      success: false,
      content: '',
      error: 'Rate limit exceeded'
    });

    await expect(agent.createProjectSpecification({} as any, {} as any))
      .rejects.toThrow('Failed to create project specification: Rate limit exceeded');
  });

  it('createProjectPlan should throw actual API error when LLM fails', async () => {
    (agent as any).llmClient.generateResponse = jest.fn().mockResolvedValue({
      success: false,
      content: '',
      error: 'Internal server error 500'
    });

    await expect(agent.createProjectPlan({ title: 'test' } as any))
      .rejects.toThrow('Failed to create project plan: Internal server error 500');
  });
});
