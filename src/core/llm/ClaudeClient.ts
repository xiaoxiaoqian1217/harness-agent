import Anthropic from '@anthropic-ai/sdk';
import { BaseLLMClient } from './LLMClient';
import { AgentConfig, AgentResponse } from '../../types/agent';
import dotenv from 'dotenv';

dotenv.config();

export class ClaudeClient extends BaseLLMClient {
  private client: Anthropic | undefined;

  async initialize(config: AgentConfig): Promise<void> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    console.error('[ClaudeClient] Initializing with model:', config.model);
    console.error('[ClaudeClient] API key length:', apiKey.length);

    this.client = new Anthropic({ apiKey });
    this.config = config;
    this.initialized = true;
    console.error('[ClaudeClient] Initialization complete');
  }

  async generateResponseInternal(
    prompt: string,
    systemPrompt?: string,
    _context?: Record<string, any>
  ): Promise<AgentResponse> {
    this.ensureInitialized();

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: prompt }
    ];

    const response = await this.client!.messages.create({
      model: this.config!.model,
      system: systemPrompt || this.config!.systemPrompt,
      messages,
      max_tokens: this.config!.maxTokens,
      temperature: this.config!.temperature,
    });

    const content = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return {
      success: true,
      content,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  async generateResponseWithToolsInternal(
    prompt: string,
    tools: any[],
    systemPrompt?: string,
    _context?: Record<string, any>
  ): Promise<AgentResponse & { toolCalls?: any[] }> {
    this.ensureInitialized();

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: prompt }
    ];

    const response = await this.client!.messages.create({
      model: this.config!.model,
      system: systemPrompt || this.config!.systemPrompt,
      messages,
      max_tokens: this.config!.maxTokens,
      temperature: this.config!.temperature,
      // @ts-ignore - Tools support is available in newer SDK versions
      tools,
    } as any);

    const content = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');

    const toolCalls = response.content
      .filter((block: any) => block.type === 'tool_use');

    return {
      success: true,
      content,
      toolCalls,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  getModelName(): string {
    this.ensureInitialized();
    return this.config!.model;
  }
}
