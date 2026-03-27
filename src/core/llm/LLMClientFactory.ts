import { LLMClient } from './LLMClient';
import { ClaudeClient } from './ClaudeClient';
import { QwenClient } from './QwenClient';
import { AgentConfig, AgentType } from '../../types/agent';

export type LLMProvider = 'claude' | 'openai' | 'doubao' | 'qwen';

export interface LLMClientConfig {
  provider: LLMProvider;
  config: AgentConfig;
}

/**
 * Factory class to create LLM client instances
 */
export class LLMClientFactory {
  private static clientCache = new Map<string, LLMClient>();

  /**
   * Create an LLM client instance for the specified provider
   * @param provider LLM provider name
   * @param config Agent configuration
   * @param useCache Whether to cache the client instance
   */
  static async createClient(
    provider: LLMProvider,
    config: AgentConfig,
    useCache = true
  ): Promise<LLMClient> {
    const cacheKey = `${provider}:${config.model}`;

    if (useCache && this.clientCache.has(cacheKey)) {
      return this.clientCache.get(cacheKey)!;
    }

    let client: LLMClient;

    switch (provider) {
      case 'claude':
        client = new ClaudeClient();
        break;

      case 'qwen':
        client = new QwenClient();
        break;

      // Add other providers here when implementing
      // case 'openai':
      //   client = new OpenAIClient();
      //   break;
      // case 'doubao':
      //   client = new DoubaoClient();
      //   break;

      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }

    await client.initialize(config);

    if (useCache) {
      this.clientCache.set(cacheKey, client);
    }

    return client;
  }

  /**
   * Create a default LLM client for a specific agent type
   * @param agentType Type of agent to create client for
   */
  static async createDefaultClientForAgent(agentType: AgentType): Promise<LLMClient> {
    const defaultConfigs: Record<AgentType, { provider: LLMProvider; config: AgentConfig }> = {
      planner: {
        provider: 'claude',
        config: {
          model: process.env.CLAUDE_MODEL || 'claude-3-opus-20240229',
          temperature: parseFloat(process.env.PLANNER_TEMPERATURE || '0.1'),
          maxTokens: parseInt(process.env.MAX_TOKENS_PER_REQUEST || '4096'),
        }
      },
      generator: {
        provider: 'claude',
        config: {
          model: process.env.CLAUDE_MODEL || 'claude-3-opus-20240229',
          temperature: parseFloat(process.env.GENERATOR_TEMPERATURE || '0.7'),
          maxTokens: parseInt(process.env.MAX_TOKENS_PER_REQUEST || '4096'),
        }
      },
      evaluator: {
        provider: 'claude',
        config: {
          model: process.env.CLAUDE_MODEL || 'claude-3-opus-20240229',
          temperature: parseFloat(process.env.EVALUATOR_TEMPERATURE || '0.3'),
          maxTokens: parseInt(process.env.MAX_TOKENS_PER_REQUEST || '4096'),
        }
      }
    };

    const { provider, config } = defaultConfigs[agentType];
    return this.createClient(provider, config);
  }

  /**
   * Clear all cached client instances
   */
  static clearCache(): void {
    this.clientCache.clear();
  }
}
