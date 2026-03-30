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
    // Get provider for each agent from environment, with sensible defaults
    const getProvider = (agent: AgentType): LLMProvider => {
      const providerMap: Record<AgentType, LLMProvider> = {
        planner: (process.env.PLANNER_PROVIDER as LLMProvider) || 'qwen',
        generator: (process.env.GENERATOR_PROVIDER as LLMProvider) || 'claude',
        evaluator: (process.env.EVALUATOR_PROVIDER as LLMProvider) || 'claude',
      };
      return providerMap[agent];
    };

    // Debug logging
    console.error(`[LLMClientFactory] Creating client for ${agentType}`);
    console.error(`[LLMClientFactory] PLANNER_PROVIDER=${process.env.PLANNER_PROVIDER}`);
    console.error(`[LLMClientFactory] GENERATOR_PROVIDER=${process.env.GENERATOR_PROVIDER}`);
    console.error(`[LLMClientFactory] EVALUATOR_PROVIDER=${process.env.EVALUATOR_PROVIDER}`);

    // Get model based on provider
    const getModel = (provider: LLMProvider): string => {
      const defaultModels: Record<LLMProvider, string> = {
        claude: process.env.CLAUDE_MODEL || 'claude-3-opus-20240229',
        qwen: process.env.QWEN_MODEL || 'qwen3.5-flash',
        openai: process.env.OPENAI_MODEL || 'gpt-4-turbo',
        doubao: process.env.DOUBAO_MODEL || 'doubao-1.5-pro',
      };
      return defaultModels[provider];
    };

    const provider = getProvider(agentType);

    const configs: Record<AgentType, AgentConfig> = {
      planner: {
        model: getModel(provider),
        temperature: parseFloat(process.env.PLANNER_TEMPERATURE || '0.1'),
        maxTokens: parseInt(process.env.MAX_TOKENS_PER_REQUEST || '4096'),
      },
      generator: {
        model: getModel(provider),
        temperature: parseFloat(process.env.GENERATOR_TEMPERATURE || '0.7'),
        maxTokens: parseInt(process.env.MAX_TOKENS_PER_REQUEST || '4096'),
      },
      evaluator: {
        model: getModel(provider),
        temperature: parseFloat(process.env.EVALUATOR_TEMPERATURE || '0.3'),
        maxTokens: parseInt(process.env.MAX_TOKENS_PER_REQUEST || '4096'),
      }
    };

    const config = configs[agentType];
    return this.createClient(provider, config);
  }

  /**
   * Clear all cached client instances
   */
  static clearCache(): void {
    this.clientCache.clear();
  }
}
