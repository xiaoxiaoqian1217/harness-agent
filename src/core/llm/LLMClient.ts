import { AgentConfig, AgentResponse } from '../../types/agent';
import { ResilientExecutor } from '../RetryHandler';

export interface LLMClient {
  /**
   * Initialize the LLM client with configuration
   */
  initialize(config: AgentConfig): Promise<void>;

  /**
   * Send a prompt to the LLM and get a response
   * @param prompt The user prompt
   * @param systemPrompt Optional system prompt to override the default
   * @param context Optional additional context
   */
  generateResponse(
    prompt: string,
    systemPrompt?: string,
    context?: Record<string, any>
  ): Promise<AgentResponse>;

  /**
   * Send a prompt with tool use capability
   * @param prompt The user prompt
   * @param tools Available tools for the LLM to use
   * @param systemPrompt Optional system prompt
   * @param context Optional additional context
   */
  generateResponseWithTools(
    prompt: string,
    tools: any[],
    systemPrompt?: string,
    context?: Record<string, any>
  ): Promise<AgentResponse & { toolCalls?: any[] }>;

  /**
   * Get the model name being used
   */
  getModelName(): string;

  /**
   * Clean up resources
   */
  cleanup(): Promise<void>;
}

/**
 * Base abstract class for LLM clients with built-in resilience
 */
export abstract class BaseLLMClient implements LLMClient {
  protected config: AgentConfig | undefined;
  protected initialized = false;
  protected resilientExecutor: ResilientExecutor;

  constructor() {
    this.resilientExecutor = new ResilientExecutor(
      {
        maxRetries: process.env.LLM_MAX_RETRIES ? parseInt(process.env.LLM_MAX_RETRIES) : 3,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        backoffFactor: 2,
      },
      {
        failureThreshold: process.env.CIRCUIT_BREAKER_THRESHOLD ? parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD) : 5,
        resetTimeoutMs: 60000,
        monitoringPeriodMs: 10000,
      }
    );
  }

  abstract initialize(config: AgentConfig): Promise<void>;
  abstract generateResponseInternal(
    prompt: string,
    systemPrompt?: string,
    context?: Record<string, any>
  ): Promise<AgentResponse>;
  abstract generateResponseWithToolsInternal(
    prompt: string,
    tools: any[],
    systemPrompt?: string,
    context?: Record<string, any>
  ): Promise<AgentResponse & { toolCalls?: any[] }>;
  abstract getModelName(): string;

  async generateResponse(
    prompt: string,
    systemPrompt?: string,
    context?: Record<string, any>
  ): Promise<AgentResponse> {
    this.ensureInitialized();

    const operationName = `LLM:${this.getModelName()}:generate`;
    return this.resilientExecutor.execute(
      () => this.generateResponseInternal(prompt, systemPrompt, context),
      operationName
    );
  }

  async generateResponseWithTools(
    prompt: string,
    tools: any[],
    systemPrompt?: string,
    context?: Record<string, any>
  ): Promise<AgentResponse & { toolCalls?: any[] }> {
    this.ensureInitialized();

    const operationName = `LLM:${this.getModelName()}:generateWithTools`;
    return this.resilientExecutor.execute(
      () => this.generateResponseWithToolsInternal(prompt, tools, systemPrompt, context),
      operationName
    );
  }

  async cleanup(): Promise<void> {
    this.initialized = false;
    this.config = undefined;
  }

  protected ensureInitialized(): void {
    if (!this.initialized || !this.config) {
      throw new Error('LLM Client not initialized. Call initialize() first.');
    }
  }

  /**
   * Check if LLM client is healthy (circuit breaker status)
   */
  isHealthy(): boolean {
    return this.resilientExecutor.isHealthy();
  }
}
