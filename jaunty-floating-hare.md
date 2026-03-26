# Harness-Style AI Agent Implementation Plan

## Context
Based on the Anthropic engineering team's Harness design philosophy for long-running application development, we will implement a production-ready AI agent using Node.js and TypeScript that can autonomously create full-stack applications from scratch. The agent follows the three-agent (Planner-Generator-Evaluator) architecture with robust governance and quality assurance systems.

## Project Goals
- Implement a complete Harness-style agent system that follows all core design principles
- Support end-to-end full-stack application generation from natural language requirements
- Incorporate the aesthetic quantization system for high-quality, original design outputs
- Implement adversarial iteration loops for continuous quality improvement
- Include proper governance and context management for long-running tasks

## Implementation Approach

### 1. Project Structure
We will build a modular, component-based architecture following this directory layout:
```
harness-agent/
├── src/
│   ├── agents/              # Planner, Generator, Evaluator agent implementations
│   ├── governance/          # CLAUDE.md management, context management, sprint contracts
│   ├── quality/             # Aesthetic evaluation, adversarial iteration, testing
│   ├── core/                # Shared SDK client, Git manager, template engine
│   ├── types/               # TypeScript type definitions
│   ├── config/              # Agent and quality configuration
│   └── index.ts             # Main entry point
├── templates/               # Project templates for different tech stacks
├── docs/                    # Documentation
└── configuration files      # package.json, tsconfig.json, etc.
```

### 2. Core Components to Implement

#### Agent Layer
- **PlannerAgent**: Converts requirements to detailed specs, selects tech stacks, creates project plans
- **GeneratorAgent**: Executes sprints, generates code, manages Git, integrates feedback
- **EvaluatorAgent**: Assesses quality across 4 dimensions, runs tests, provides feedback

#### Governance Layer
- **ClaudeMdManager**: Generates and validates CLAUDE.md specification files
- **ContextManager**: Handles context compression and state transfer for long-running tasks
- **SprintContractManager**: Negotiates and validates sprint contracts between agents

#### Quality Assurance Layer
- **AestheticEvaluator**: Implements 4-dimensional scoring (design, originality, craft, functionality)
- **AdversarialLoop**: Orchestrates the Generator-Evaluator feedback loop with refine/pivot logic
- **TestOrchestrator**: Manages Playwright E2E testing and API validation

### 3. Dependencies
Key dependencies include:
- `@anthropic-ai/sdk` and `@anthropic-ai/claude-code-sdk` for LLM interactions and code operations
- `simple-git` for version control operations
- `playwright` for E2E testing and visual evaluation
- `zod` for schema validation
- `winston` for structured logging
- Full list available in the detailed plan

### 4. Multi-Model Support Architecture
The system implements a pluggable multi-model architecture with Claude as the default implementation:

#### Core Design
- **Abstract LLM Client Layer**: Unified interface for all LLM operations, decoupling business logic from specific model implementations
- **Adapter Pattern**: Each model provider implements a lightweight adapter to convert between the standard interface and model-specific APIs
- **Default Implementation**: Claude 3 series (Opus/Sonnet/Haiku) is the default and best-optimized model

#### Supported Models (Extensible)
- ✅ Claude 3 Opus/Sonnet/Haiku (default, fully optimized)
- 🔌 OpenAI GPT-4/GPT-3.5 (adapter available)
- 🔌 ByteDance Doubao series (adapter available)
- 🔌 Alibaba Qwen series (adapter available)
- 🔌 All OpenAI API-compatible models

#### Key Features
- **Per-Agent Model Configuration**: Different agents can use different models (e.g. Planner uses high-intelligence model, Generator uses cost-effective model)
- **Automatic Fallback**: If primary model fails, automatically switch to configured backup model
- **Load Balancing**: Distribute requests across multiple model providers for high availability
- **Cost Optimization**: Auto-select the most cost-effective model based on task complexity

#### Extension Guide
Adding support for a new model only requires implementing a 50-100 line adapter that handles:
1. Request format conversion (standard prompt → model-specific format)
2. Response parsing (model output → standard AgentResponse)
3. Tool call format conversion between model and Claude Code SDK
No changes to core business logic are required.

### 4. Implementation Roadmap
We will implement in phases:
1. **Foundation Setup**: Project structure, TypeScript config, core utilities
2. **Core Agents**: Implement Planner, Generator, and Evaluator agents
3. **Governance Layer**: Build specification management and context systems
4. **Quality System**: Implement aesthetic evaluation and adversarial iteration
5. **Integration**: Build orchestration layer and CLI interface
6. **Testing & Hardening**: End-to-end testing, optimization, documentation

## Critical Files to Create/Modify
- `/package.json` - Project dependencies and scripts
- `/tsconfig.json` - TypeScript configuration
- `/src/types/*.ts` - Core type definitions
- `/src/agents/*.ts` - Three main agent implementations
- `/src/governance/*.ts` - Governance layer components
- `/src/quality/*.ts` - Quality assurance system
- `/src/core/*.ts` - Shared core functionality
- `/src/index.ts` - Main entry point and orchestration

## Enhanced Iteration Generation Mechanism
The system implements a multi-level iterative optimization architecture to ensure continuous improvement:

### 1. Core Adversarial Iteration Loop
- **Dual-agent feedback mechanism**: Generator creates implementation → Evaluator provides granular feedback → Generator refines based on feedback, repeating until quality thresholds are met
- **Smart decision logic**:
  - Quality score ≥ 85/100: Sprint passes, proceed to next phase
  - 60 ≤ score < 85: Targeted refinement based on specific feedback points
  - Score < 60: Full design pivot, abandon current approach and restart with new design direction
- **Configurable iteration limits**: Default maximum 5 iterations per sprint to balance quality and cost
- **Incremental update optimization**: Only pass modified code and delta feedback between iterations to reduce token consumption

### 2. Context Persistence Across Iterations
- **State Transfer Document (STD)**: Structured document that captures all project state, progress, decisions, and feedback between iterations
- **Intelligent context compression**: Automatically retains critical information while discarding redundant conversation history, reducing context size by up to 70% without losing semantic meaning
- **Session reset resilience**: Ability to resume work from any iteration point even after complete context reset, using STD as single source of truth

## Enhanced Design Aesthetics Guarantee System
A multi-layered quality control system to ensure production-grade, original design outputs:

### 1. Four-Dimensional Scoring Rubric (Weighted)
| Dimension | Weight | Evaluation Criteria |
|-----------|--------|---------------------|
| Design Quality | 35% | Visual identity coherence, brand alignment, adherence to modern design principles (apple HIG/Material Design), "museum-grade" aesthetic standards |
| Originality | 30% | Custom design decision ratio, penalty for overuse of default UI library styles, uniqueness of visual language, avoidance of generic AI design patterns |
| Craft Execution | 20% | Spacing consistency (4/8px grid system), typography hierarchy (clear H1-H6/body text sizing), color harmony (WCAG contrast compliance), responsive design implementation |
| Functional Usability | 15% | Task completion rate, intuitive navigation, error state handling, loading state design, accessibility compliance |

### 2. Visual Evaluation Capabilities
- **Playwright screenshot analysis**: Automatically renders pages at multiple viewport sizes (mobile/tablet/desktop) for visual assessment
- **Design system validation**: Cross-check against built-in design system tokens for consistency
- **Image processing pipeline**: Uses sharp for color analysis, layout detection, and visual regression checking between iterations
- **Anti-pattern detection**: Identifies common AI design flaws (inconsistent spacing, generic gradients, mismatched icon styles, poor typography)

### 3. Design Knowledge Base
- Built-in reference to award-winning design patterns (Awwwards, Dribbble top 0.1% designs)
- Component library best practices (Radix UI, shadcn/ui, Tailwind UI customization guidelines)
- Modern design trend awareness (2024-2026 design language standards)
- Accessibility (a11y) compliance rules (WCAG 2.1 AA standard)

## Playwright MCP Integration
We will integrate the Playwright MCP (Model Context Protocol) server for advanced testing and visual evaluation capabilities:

### Implementation Details
- **MCP Server Integration**: Connect to the official Playwright MCP server for browser automation capabilities
- **Capabilities enabled**:
  - Real browser page rendering and screenshot capture
  - DOM element inspection and accessibility testing
  - User interaction simulation (clicks, form inputs, navigation)
  - Network request interception and API response validation
  - Performance metrics collection (load time, LCP, FID, CLS)
- **Evaluation Workflow**:
  1. Generator builds and runs the application locally
  2. Evaluator triggers Playwright MCP to load the application
  3. Run automated test scenarios and capture screenshots at multiple viewports
  4. Extract DOM structure, styles, and performance data for quality assessment
  5. Generate detailed visual and functional feedback for the Generator

## CLI Interface Design
The agent will provide a user-friendly command-line interface for easy interaction:

### CLI Commands
```bash
# Initialize a new project (auto-select tech stack)
harness-agent init "Build a personal portfolio website with blog functionality"

# Specify full tech stack
harness-agent init "E-commerce product page" --stack react-fastapi --output ./my-project

# Separately specify frontend, backend, database tech stacks
harness-agent init "E-commerce management system" \
  --frontend react-vite-tailwind \
  --backend fastapi-sqlalchemy \
  --database postgresql

# Resume an existing project
harness-agent resume ./my-project

# Run quality assessment on existing project
harness-agent evaluate ./my-project

# Show configuration options
harness-agent config --list

# List supported tech stacks
harness-agent stacks list
```

### Intelligent Tech Stack Selection
The system automatically selects the most appropriate architecture and tech stack based on project requirements:

#### Custom Tech Stack Support
- **Frontend options**: React/Vue/Angular/Svelte/Next.js/Nuxt/Astro/Vanilla JS
- **Backend options**: Node.js/Express/NestJS/Python/FastAPI/Go/Java/Rust
- **Database options**: MySQL/PostgreSQL/MongoDB/Redis/SQLite/Supabase

#### Auto Architecture Decision
The system automatically decides whether to use separated frontend/backend architecture based on:
1. **Project complexity**: Complex systems with dynamic data → separated; static sites → monolithic
2. **Functional requirements**: User authentication, APIs, database operations → separated
3. **Performance needs**: High concurrency, independent deployment, CDN acceleration → separated
4. **Team structure**: Multi-team parallel development → separated
5. **Extensibility requirements**: Future feature expansion, microservices → separated
6. **User preference**: Explicit user instructions override automatic decisions

### CLI Features
- Interactive prompts for requirement clarification when needed
- Real-time progress display with sprint status and quality scores
- Live preview option to open the generated application in browser during development
- Export options for project documentation and quality reports
- Configuration management for API keys, quality thresholds, and default preferences

## Demo Validation Scenario
To verify the agent implementation is successful, we will run a complete end-to-end demo:

### Demo Test Case (Full-Stack Version)
**Requirement**: "Build a modern, visually striking todo application with dark/light mode toggle, drag-and-drop task sorting, user registration/login, and persistent data storage. The design should be award-worthy with smooth animations and excellent mobile responsiveness."

#### Tech Stack for Demo
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: SQLite (file-based, no external dependency needed)
- Authentication: JWT tokens
- API: RESTful interface for todo CRUD operations and user management

### Success Criteria
1. **Complete Generation**: Agent generates a fully functional React application with all requested features
2. **Quality Scores**: Overall quality score ≥ 85/100, with design quality ≥ 80 and originality ≥ 80
3. **Functionality**: All features work correctly as verified by Playwright E2E tests
4. **Iteration Loop**: Agent successfully completes at least 1 refinement iteration based on evaluator feedback
5. **CLI Usability**: The entire process can be initiated and monitored through the CLI interface

### Demo Output Deliverables
- Complete source code of the todo application
- Git commit history showing the iterative development process
- Quality assessment report with scores across all four dimensions
- Screenshots of the final application at multiple viewport sizes
- Performance metrics report from Playwright

## Verification Plan
1. Unit tests for all core components
2. Integration tests for agent collaboration flows
3. Playwright MCP integration test: Verify browser automation and visual evaluation works
4. CLI interface test: Validate all commands work as expected
5. End-to-end demo test: Run the todo application demo and verify all success criteria are met
6. Validate quality scoring system against the 4-dimensional rubric
7. Test context management and state transfer across session resets
8. Verify Git operations and version control integration
9. Validate iteration loop: Test refine and pivot scenarios with low-quality initial designs
10. Design quality validation: Verify aesthetic scoring correctly identifies common design flaws and rewards original, high-quality designs
