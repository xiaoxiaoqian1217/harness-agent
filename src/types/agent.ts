import { z } from 'zod';

export const AgentTypeSchema = z.enum(['planner', 'generator', 'evaluator']);
export type AgentType = z.infer<typeof AgentTypeSchema>;

export const AgentConfigSchema = z.object({
  model: z.string().default('claude-3-opus-20240229'),
  temperature: z.number().min(0).max(1).default(0.7),
  maxTokens: z.number().default(4096),
  systemPrompt: z.string().optional(),
});
export type AgentConfig = z.infer<typeof AgentConfigSchema>;

export const AgentResponseSchema = z.object({
  success: z.boolean(),
  content: z.string(),
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
    totalTokens: z.number(),
  }),
  error: z.string().optional(),
});
export type AgentResponse = z.infer<typeof AgentResponseSchema>;

export interface BaseAgent {
  type: AgentType;
  config: AgentConfig;

  initialize(): Promise<void>;
  execute(prompt: string, context?: Record<string, any>): Promise<AgentResponse>;
  cleanup(): Promise<void>;
}

export const PlannerAgentConfigSchema = AgentConfigSchema.extend({
  temperature: z.number().min(0).max(1).default(0.1),
});
export type PlannerAgentConfig = z.infer<typeof PlannerAgentConfigSchema>;

export const GeneratorAgentConfigSchema = AgentConfigSchema.extend({
  temperature: z.number().min(0).max(1).default(0.7),
});
export type GeneratorAgentConfig = z.infer<typeof GeneratorAgentConfigSchema>;

export const EvaluatorAgentConfigSchema = AgentConfigSchema.extend({
  temperature: z.number().min(0).max(1).default(0.3),
});
export type EvaluatorAgentConfig = z.infer<typeof EvaluatorAgentConfigSchema>;
