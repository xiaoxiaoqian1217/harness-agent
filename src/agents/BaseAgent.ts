import { LLMClient, LLMClientFactory } from '../core/llm';
import { AgentType, AgentConfig, AgentResponse } from '../types/agent';
import { agentConfig } from '../config';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

export abstract class BaseAgent {
  protected type: AgentType;
  protected llmClient: LLMClient | undefined;
  protected config: AgentConfig;
  protected logger = logger;

  constructor(type: AgentType, customConfig?: Partial<AgentConfig>) {
    this.type = type;

    // Get default config for this agent type
    const defaultConfig = agentConfig[type];

    this.config = {
      model: agentConfig.defaultModel,
      maxTokens: agentConfig.maxTokensPerRequest,
      ...defaultConfig,
      ...customConfig,
    };
  }

  /**
   * Initialize the agent and LLM client
   */
  async initialize(): Promise<void> {
    this.logger.info(`Initializing ${this.type} agent`);

    this.llmClient = await LLMClientFactory.createDefaultClientForAgent(this.type);

    this.logger.info(`${this.type} agent initialized with model: ${this.llmClient.getModelName()}`);
  }

  /**
   * Execute the agent's core functionality
   * @param input Input data for the agent
   */
  abstract execute(input: any): Promise<any>;

  /**
   * Send a prompt to the LLM and get a response
   * @param prompt The user prompt
   * @param systemPrompt Optional system prompt override
   * @param context Optional additional context
   */
  protected async generateResponse(
    prompt: string,
    systemPrompt?: string,
    context?: Record<string, any>
  ): Promise<AgentResponse> {
    if (!this.llmClient) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }

    return this.llmClient.generateResponse(
      prompt,
      systemPrompt || this.config.systemPrompt,
      context
    );
  }

  /**
   * Send a prompt with tool use capability
   * @param prompt The user prompt
   * @param tools Available tools for the LLM to use
   * @param systemPrompt Optional system prompt override
   * @param context Optional additional context
   */
  protected async generateResponseWithTools(
    prompt: string,
    tools: any[],
    systemPrompt?: string,
    context?: Record<string, any>
  ): Promise<AgentResponse & { toolCalls?: any[] }> {
    if (!this.llmClient) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }

    return this.llmClient.generateResponseWithTools(
      prompt,
      tools,
      systemPrompt || this.config.systemPrompt,
      context
    );
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    this.logger.info(`Cleaning up ${this.type} agent`);

    if (this.llmClient) {
      await this.llmClient.cleanup();
      this.llmClient = undefined;
    }
  }

  /**
   * Get the agent type
   */
  getType(): AgentType {
    return this.type;
  }

  /**
   * Get the agent configuration
   */
  getConfig(): AgentConfig {
    return this.config;
  }
}
