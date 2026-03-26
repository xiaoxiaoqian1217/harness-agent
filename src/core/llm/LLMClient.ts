import { AgentConfig, AgentResponse } from '../../types/agent';

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
 * Base abstract class for LLM clients
 */
export abstract class BaseLLMClient implements LLMClient {
  protected config: AgentConfig | undefined;
  protected initialized = false;

  abstract initialize(config: AgentConfig): Promise<void>;
  abstract generateResponse(prompt: string, systemPrompt?: string, context?: Record<string, any>): Promise<AgentResponse>;
  abstract generateResponseWithTools(prompt: string, tools: any[], systemPrompt?: string, context?: Record<string, any>): Promise<AgentResponse & { toolCalls?: any[] }>;
  abstract getModelName(): string;

  async cleanup(): Promise<void> {
    this.initialized = false;
    this.config = undefined;
  }

  protected ensureInitialized(): void {
    if (!this.initialized || !this.config) {
      throw new Error('LLM Client not initialized. Call initialize() first.');
    }
  }
}
