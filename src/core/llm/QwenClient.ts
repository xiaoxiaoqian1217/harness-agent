import axios from 'axios';
import { BaseLLMClient } from './LLMClient';
import { AgentConfig, AgentResponse } from '../../types/agent';
import dotenv from 'dotenv';

dotenv.config();

interface QwenMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface QwenChatCompletionRequest {
  model: string;
  messages: QwenMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface QwenChatCompletionResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class QwenClient extends BaseLLMClient {
  private apiKey: string | undefined;
  private baseURL: string;

  constructor() {
    super();
    this.baseURL = process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  }

  async initialize(config: AgentConfig): Promise<void> {
    this.apiKey = process.env.QWEN_API_KEY;
    if (!this.apiKey) {
      throw new Error('QWEN_API_KEY environment variable is not set');
    }

    this.config = config;
    this.initialized = true;
  }

  async generateResponseInternal(
    prompt: string,
    systemPrompt?: string,
    _context?: Record<string, any>
  ): Promise<AgentResponse> {
    this.ensureInitialized();

    const messages: QwenMessage[] = [];

    // Add system prompt if provided
    if (systemPrompt || this.config?.systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt || this.config!.systemPrompt!,
      });
    }

    // Add user message
    messages.push({
      role: 'user',
      content: prompt,
    });

    const requestBody: QwenChatCompletionRequest = {
      model: this.config!.model,
      messages,
      temperature: this.config!.temperature,
      max_tokens: this.config!.maxTokens,
    };

    try {
      const response = await axios.post<QwenChatCompletionResponse>(
        `${this.baseURL}/chat/completions`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      const choice = response.data.choices[0];
      const content = choice.message.content;
      const usage = response.data.usage;

      return {
        success: true,
        content,
        usage: {
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      return {
        success: false,
        content: '',
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
        },
        error: errorMessage,
      };
    }
  }

  async generateResponseWithToolsInternal(
    prompt: string,
    tools: any[],
    systemPrompt?: string,
    _context?: Record<string, any>
  ): Promise<AgentResponse & { toolCalls?: any[] }> {
    this.ensureInitialized();

    const messages: QwenMessage[] = [];

    // Add system prompt if provided
    if (systemPrompt || this.config?.systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt || this.config!.systemPrompt!,
      });
    }

    // Add user message
    messages.push({
      role: 'user',
      content: prompt,
    });

    const requestBody: any = {
      model: this.config!.model,
      messages,
      temperature: this.config!.temperature,
      max_tokens: this.config!.maxTokens,
      tools,
    };

    try {
      const response = await axios.post<any>(
        `${this.baseURL}/chat/completions`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      const choice = response.data.choices[0];
      const content = choice.message.content || '';
      const usage = response.data.usage;
      const toolCalls = choice.message.tool_calls || [];

      return {
        success: true,
        content,
        toolCalls,
        usage: {
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      return {
        success: false,
        content: '',
        toolCalls: [],
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
        },
        error: errorMessage,
      };
    }
  }

  getModelName(): string {
    this.ensureInitialized();
    return this.config!.model;
  }
}
