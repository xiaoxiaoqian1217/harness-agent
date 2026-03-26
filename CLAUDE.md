# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Harness Agent is a TypeScript/Node.js implementation of the Anthropic Harness design philosophy for autonomous full-stack application generation. It uses a three-agent architecture (Planner-Generator-Evaluator) with governance and quality assurance systems.

## Build & Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Run in development mode (ts-node)
npm run dev

# Run tests
npm test
npm run test:watch

# Linting and formatting
npm run lint
npm run lint:fix
npm run format

# Type checking
npm run typecheck

# Install Playwright browsers for E2E testing
npm run playwright:install
```

## Architecture Overview

### Three-Agent Collaboration Pattern

The system uses three specialized agents that work together:

1. **PlannerAgent** (temperature=0.1)
   - Analyzes requirements and generates detailed specifications
   - Recommends appropriate tech stacks
   - Creates project plans and sprint contracts
   - Located: `src/agents/PlannerAgent.ts`

2. **GeneratorAgent** (temperature=0.7)
   - Executes sprints and generates code
   - Manages Git operations and commits
   - Integrates feedback from evaluator
   - Located: `src/agents/GeneratorAgent.ts`

3. **EvaluatorAgent** (temperature=0.3)
   - Performs four-dimensional quality assessment (design, originality, craft, functionality)
   - Runs Playwright E2E tests
   - Provides structured feedback for refinement
   - Located: `src/agents/EvaluatorAgent.ts`

### Core Layers

**Agent Layer** (`src/agents/`)
- `BaseAgent`: Abstract base class providing LLM integration and common utilities
- All agents inherit from BaseAgent and implement the `execute()` method

**LLM Abstraction** (`src/core/llm/`)
- `LLMClient`: Interface defining standard LLM operations
- `ClaudeClient`: Default implementation using @anthropic-ai/sdk
- `LLMClientFactory`: Factory for creating and configuring LLM clients
- Supports multi-model architecture (Claude default, extensible to other providers)

**Governance Layer** (`src/governance/`)
- `ClaudeMdManager`: Manages CLAUDE.md specification files
- `ContextManager`: Handles context compression and state transfer for long-running tasks
- `SprintContractManager`: Negotiates and validates sprint contracts between agents

**Quality Layer** (`src/quality/`)
- `AdversarialLoop`: Orchestrates Generator-Evaluator feedback loop
- Quality thresholds: ≥85 pass, 60-85 refine, <60 pivot

**Configuration** (`src/config/`)
- `agent.config.ts`: Agent-specific settings (model, temperature, max tokens)
- `quality.rubric.ts`: Four-dimensional scoring weights and criteria
- `tech-stacks.config.ts`: Supported technology combinations

### Type System (`src/types/`)

- `agent.ts`: Agent types, configs, and responses (Zod schemas)
- `project.ts`: Project structure and metadata
- `quality.ts`: Quality scoring and evaluation types
- `governance.ts`: Governance-related types

## Key Design Patterns

### Multi-Model Architecture
- Abstract `LLMClient` interface decouples business logic from specific models
- Adapter pattern allows adding new model providers (OpenAI, Doubao, etc.)
- Per-agent model configuration enables cost/quality optimization
- Default: Claude 3 Opus (best performance)

### Dependency Injection
- Agents receive LLMClient via factory, not direct instantiation
- Enables testing and model switching without code changes

### Configuration-Driven
- Agent behavior controlled via `AgentConfig` (model, temperature, tokens)
- Quality thresholds and tech stacks defined in config files
- Zod schemas validate all configurations at runtime

## Important Implementation Details

### Agent Initialization Flow
```typescript
const agent = new PlannerAgent();
await agent.initialize();  // Creates LLMClient via factory
const response = await agent.execute(input);
await agent.cleanup();     // Releases resources
```

### LLM Response Format
All LLM calls return `AgentResponse`:
```typescript
{
  success: boolean;
  content: string;
  usage: { inputTokens, outputTokens, totalTokens };
  error?: string;
}
```

### Quality Scoring (Four Dimensions)
- Design Quality (35%): Visual coherence, brand alignment, modern principles
- Originality (30%): Custom design ratio, uniqueness, avoids generic patterns
- Craft Execution (20%): Spacing, typography, color harmony, responsive design
- Functional Usability (15%): Task completion, navigation, accessibility

### Iteration Logic
- Score ≥85: Pass, proceed to next phase
- 60≤score<85: Targeted refinement with specific feedback
- Score <60: Full pivot, restart with new design direction
- Max 5 iterations per sprint

## File Organization

```
src/
├── agents/           # Planner, Generator, Evaluator implementations
├── governance/       # CLAUDE.md, Context, Sprint Contract managers
├── quality/          # Adversarial loop and evaluation
├── core/
│   ├── llm/         # LLM client abstraction and implementations
│   └── GitManager.ts # Version control operations
├── types/           # TypeScript type definitions (Zod schemas)
├── config/          # Agent, quality, and tech stack configurations
└── index.ts         # Main entry point
```

## Testing

- Jest configured for unit tests
- Playwright for E2E testing and visual evaluation
- Run `npm test` for unit tests
- Run `npm run playwright:install` before running visual tests

## Environment Setup

- Node.js 20+
- TypeScript 5.3+
- Requires `ANTHROPIC_API_KEY` environment variable for Claude API access
- Optional: `.env` file for configuration

## Common Development Tasks

**Adding a new agent type:**
1. Create class extending `BaseAgent` in `src/agents/`
2. Implement `execute()` method
3. Add config to `src/config/agent.config.ts`
4. Update `AgentType` enum in `src/types/agent.ts`

**Extending to new LLM provider:**
1. Create adapter class implementing `LLMClient` interface
2. Add to `LLMClientFactory.createDefaultClientForAgent()`
3. No changes needed to agent code

**Modifying quality scoring:**
1. Update weights in `src/config/quality.rubric.ts`
2. Adjust thresholds in `AdversarialLoop` if needed
3. Modify evaluation logic in `EvaluatorAgent`

## Next Steps for Implementation

- Complete Quality layer: `AestheticEvaluator`, `TestOrchestrator`
- Implement CLI interface with Commander.js
- Build main orchestration logic in `src/index.ts`
- Add E2E demo validation scenario
- Complete integration tests
