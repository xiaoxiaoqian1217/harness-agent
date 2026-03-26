import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

export const AgentGlobalConfigSchema = z.object({
  defaultModel: z.string().default(process.env.CLAUDE_MODEL || 'claude-3-opus-20240229'),
  maxTokensPerRequest: z.number().default(parseInt(process.env.MAX_TOKENS_PER_REQUEST || '4096')),
  defaultProvider: z.enum(['claude', 'openai', 'doubao', 'qwen']).default('claude'),

  planner: z.object({
    temperature: z.number().default(parseFloat(process.env.PLANNER_TEMPERATURE || '0.1')),
    systemPrompt: z.string().default(`
You are a professional software architect and product planner. Your role is to:
1. Analyze user requirements and create detailed, actionable project specifications
2. Select appropriate technology stacks based on project needs
3. Design scalable, maintainable architecture
4. Break down projects into manageable sprints and tasks
5. Define clear acceptance criteria for each deliverable

Follow these principles:
- Prioritize simplicity and maintainability over over-engineering
- Consider performance, security, and accessibility in all designs
- Ensure all plans are realistic and implementable
- Use modern, well-supported technologies
- Include clear success metrics for each phase
    `).trim(),
  }),

  generator: z.object({
    temperature: z.number().default(parseFloat(process.env.GENERATOR_TEMPERATURE || '0.7')),
    systemPrompt: z.string().default(`
You are an expert full-stack developer. Your role is to:
1. Write clean, efficient, production-quality code
2. Follow best practices and coding standards
3. Implement features exactly according to specifications
4. Write comprehensive tests for all functionality
5. Ensure code is well-documented and maintainable

Follow these principles:
- Write type-safe code with proper error handling
- Follow modern framework conventions
- Ensure responsive, accessible design
- Optimize for performance and user experience
- Include proper security measures
- Test all edge cases
    `).trim(),
  }),

  evaluator: z.object({
    temperature: z.number().default(parseFloat(process.env.EVALUATOR_TEMPERATURE || '0.3')),
    systemPrompt: z.string().default(`
You are a senior software engineer and quality assurance expert. Your role is to:
1. Evaluate code quality, design aesthetics, and functionality
2. Provide detailed, actionable feedback for improvement
3. Ensure all requirements are fully met
4. Test for bugs, performance issues, and security vulnerabilities
5. Enforce quality standards and best practices

Be strict and thorough in your evaluation. Prioritize:
- Functional correctness and completeness
- Design quality and user experience
- Code maintainability and performance
- Security and accessibility compliance
- Adherence to specifications and standards
    `).trim(),
  }),

  qualityThresholds: z.object({
    minPassScore: z.number().default(parseInt(process.env.MIN_PASS_SCORE || '85')),
    pivotThreshold: z.number().default(parseInt(process.env.PIVOT_THRESHOLD || '60')),
    maxIterations: z.number().default(parseInt(process.env.MAX_ITERATIONS || '5')),
  }),

  project: z.object({
    defaultWorkspace: z.string().default(process.env.DEFAULT_WORKSPACE || './workspace'),
    gitAutoCommit: z.boolean().default(true),
    createSnapshots: z.boolean().default(true),
  }),

  playwright: z.object({
    headless: z.boolean().default(process.env.PLAYWRIGHT_HEADLESS === 'true'),
    viewportWidth: z.number().default(parseInt(process.env.PLAYWRIGHT_VIEWPORT_WIDTH || '1920')),
    viewportHeight: z.number().default(parseInt(process.env.PLAYWRIGHT_VIEWPORT_HEIGHT || '1080')),
    defaultBrowser: z.enum(['chromium', 'firefox', 'webkit']).default('chromium'),
  }),
});

export type AgentGlobalConfig = z.infer<typeof AgentGlobalConfigSchema>;

export const agentConfig = AgentGlobalConfigSchema.parse({});
