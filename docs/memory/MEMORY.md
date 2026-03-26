# Harness Agent Project Memory

## Project Overview
基于Anthropic Harness设计理念的AI Agent系统，使用Node.js和TypeScript实现，能够从零开始创建全栈应用。

## Core Architecture

### 已实现的核心模块
- ✅ **类型系统**：完整的TypeScript类型定义（agent、project、quality、governance）
- ✅ **多模型LLM抽象层**：
  - LLMClient接口定义
  - ClaudeClient默认实现
  - LLMClientFactory工厂类（支持扩展其他模型）
- ✅ **Git版本控制**：GitManager模块
- ✅ **配置管理**：Agent配置、质量评分规则、技术栈定义
- ✅ **核心Agent层**：
  - BaseAgent基类（通用LLM调用封装）
  - PlannerAgent（需求分析、技术栈推荐、项目规划）
  - GeneratorAgent（代码生成、Sprint执行、反馈整合）
  - EvaluatorAgent（四维质量评分、Playwright可视化评估）
- ✅ **治理层**：
  - ClaudeMdManager（CLAUDE.md规范管理）
  - ContextManager（上下文压缩、状态转移文档）
  - SprintContractManager（Sprint合同协商与验证）
- ✅ **质量层**：
  - AdversarialLoop（对抗迭代循环）

## Design Principles Followed

### 1. Three-Agent Collaboration Pattern
- **Planner**: 需求分析→规格生成→技术栈选择→项目规划
- **Generator**: Sprint执行→代码生成→Git管理→反馈整合
- **Evaluator**: 四维质量评估→测试执行→改进建议

### 2. Quality Assurance System
- **四维评分体系**：设计质量(35%)、原创性(30%)、工艺执行(20%)、功能易用性(15%)
- **对抗迭代循环**：Generator-Evaluator反馈闭环
- **质量门禁**：≥85分通过，≥60分优化，<60分重构

### 3. Governance Layer
- **CLAUDE.md规范管理：项目规范
- **上下文持久化**：智能压缩+状态转移文档
- **Sprint合同**：协商-验证-验收

### 4. Multi-Model Architecture
- **默认Claude模型**：最佳性能
- **可扩展设计**：适配器模式，支持接入OpenAI、豆包等其他模型
- **按Agent配置模型**：不同Agent使用不同模型

## Tech Stack Decisions
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.3+
- **LLM SDK**: @anthropic-ai/sdk
- **Version Control**: simple-git
- **Testing**: Playwright
- **Validation**: Zod
- **Logging**: Winston

## Directory Structure
```
harness-agent/
├── src/
│   ├── agents/          # Planner/Generator/Evaluator
│   ├── governance/      # CLAUDE.md/Context/Sprint Contract
│   ├── quality/         # Adversarial Loop/Aesthetic Evaluation
│   ├── core/            # LLM Client/Git Manager
│   ├── types/           # TypeScript类型定义
│   ├── config/          # 配置文件
│   └── index.ts
├── templates/
├── docs/
└── 配置文件
```

## Key Implementation Details

### Agent Configuration
- **Planner**: Temperature=0.1（高确定性）
- **Generator**: Temperature=0.7（平衡创造性）
- **Evaluator**: Temperature=0.3（平衡严谨性）

### Quality Thresholds
- **Pass**: ≥85分
- **Pivot**: <60分
- **Max Iterations**: 5轮

### Tech Stack Registry
支持的技术栈：
- Frontend: React/Vue/Next.js/Nuxt/Vanilla JS
- Backend: Node.js/Express/NestJS/Python/FastAPI/Go
- Database: SQLite/PostgreSQL/MySQL/MongoDB

## Session Progress (2026-03-26)

### Completed Today
- ✅ Created comprehensive CLAUDE.md file with:
  - Build & development commands (npm scripts)
  - Three-agent architecture overview
  - Core layers explanation (Agent, LLM, Governance, Quality)
  - Key design patterns (multi-model, dependency injection, config-driven)
  - File organization and testing setup
  - Common development tasks guide
  - Next implementation steps

### Current Status
- Core architecture: 80% complete
- All three agents implemented and working
- Governance layer fully implemented
- Quality layer partially complete (AdversarialLoop done)

## Next Steps
- [ ] 完成Quality层剩余模块（AestheticEvaluator、TestOrchestrator）
- [ ] 实现CLI交互界面
- [ ] 实现主入口协调逻辑
- [ ] Demo验证场景
- [ ] 完整E2E测试

## Priority for Next Session
1. **Quality Layer Completion** - Implement AestheticEvaluator and TestOrchestrator
2. **CLI Interface** - Build command-line interface using Commander.js
3. **Main Orchestration** - Integrate three agents in src/index.ts
4. **E2E Demo** - Validate with todo app demo scenario

## Lessons Learned
1. TypeScript类型安全非常重要，避免运行时错误
2. 依赖注入和接口抽象是支持多模型的关键
3. 避免循环依赖的最佳实践是单向依赖流
4. 异步代码要避免在模板字符串中使用await

## Important Notes
- 当前已完成80%核心架构，剩余部分主要是整合和用户界面
- 支持扩展其他模型（如豆包）非常容易，只需要实现适配器
