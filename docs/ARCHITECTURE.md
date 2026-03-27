# Harness Agent 项目架构概述

## 项目简介
Harness Agent 是基于 Anthropic Harness 设计理念的 TypeScript/Node.js 实现，用于自主生成全栈应用。采用**三代理协作架构**（Planner-Generator-Evaluator）结合治理层与质量保证系统，能够将自然语言需求转化为生产级、高审美质量的完整应用。

---

## 系统架构图
```mermaid
flowchart TD
    User[用户输入] --> CLI[CLI 界面]
    CLI --> Orchestrator[主编排器]

    subgraph 核心代理层
        Planner[PlannerAgent<br/>(温度: 0.1)]
        Generator[GeneratorAgent<br/>(温度: 0.7)]
        Evaluator[EvaluatorAgent<br/>(温度: 0.3)]
    end

    subgraph 治理层
        ClaudeMd[CLAUDE.md 管理器]
        Context[上下文管理器]
        Sprint[冲刺契约管理器]
    end

    subgraph 质量保证层
        Adversarial[对抗性迭代循环]
        Aesthetic[审美评估器]
        Test[测试编排器]
    end

    subgraph 核心抽象层
        LLM[LLM 客户端抽象]
        Git[Git 管理器]
    end

    subgraph 配置中心
        AgentConfig[代理配置]
        QualityConfig[质量评分配置]
        TechConfig[技术栈配置]
    end

    Orchestrator --> Planner
    Planner --> Sprint
    Sprint --> Generator
    Generator --> Git
    Generator --> Adversarial
    Adversarial --> Evaluator
    Evaluator --> Aesthetic
    Evaluator --> Test
    Test --> Playwright[Playwright MCP]

    Planner --> LLM
    Generator --> LLM
    Evaluator --> LLM

    Context --> 治理层
    ClaudeMd --> 治理层

    配置中心 --> 所有组件

    Adversarial -->|反馈| Generator
    Evaluator -->|评分结果| Orchestrator

    style User fill:#f9f,stroke:#333,stroke-width:2px
    style CLI fill:#9f9,stroke:#333,stroke-width:2px
    style 核心代理层 fill:#f96,stroke:#333,stroke-width:2px
    style 治理层 fill:#69f,stroke:#333,stroke-width:2px
    style 质量保证层 fill:#ff6,stroke:#333,stroke-width:2px
```

---

## 核心组件说明

### 1. 代理层
| 代理 | 职责 | 核心产出 |
|------|------|----------|
| **PlannerAgent** | 需求分析、架构设计、技术栈选择、冲刺规划 | 详细产品规格书、技术栈定义、项目路线图、冲刺契约 |
| **GeneratorAgent** | 代码生成、版本控制、迭代优化 | 完整可运行代码、Git 提交记录、可交付功能 |
| **EvaluatorAgent** | 质量评估、自动化测试、反馈生成 | 四维质量评分报告、E2E测试结果、改进建议 |

### 2. 治理层
- **CLAUDE.md 管理器**：维护项目规范，实现渐进式上下文披露
- **上下文管理器**：智能压缩上下文，支持长任务状态持久化与恢复
- **冲刺契约管理器**：明确定义每个冲刺的完成标准，对齐代理预期

### 3. 质量保证层
- **对抗性迭代循环**：驱动 Generator-Evaluator 反馈闭环，实现自动细化/转向决策
- **审美评估器**：四维评分体系（设计35%、原创性30%、工艺20%、功能性15%）
- **测试编排器**：集成 Playwright 实现真实浏览器测试、视觉评估、交互验证

### 4. 核心特性
- **多模型架构**：抽象 LLM 接口，默认支持 Claude 3 系列，可扩展 OpenAI/Doubao/Qwen 等
- **智能迭代逻辑**：≥85分通过，60-85分细化，<60分完全转向
- **成本优化**：按任务复杂度自动选择最适配模型，增量更新减少Token消耗

---

## 用户使用指南

### 环境准备
1. **依赖安装**
```bash
# 安装项目依赖
npm install

# 安装 Playwright 浏览器（用于视觉评估）
npm run playwright:install
```

2. **环境配置**
在项目根目录创建 `.env` 文件：
```env
ANTHROPIC_API_KEY=your_api_key_here
# 可选：配置其他模型提供商的API Key
```

### 基础使用

#### 1. 初始化新项目
```bash
# 自动选择技术栈
harness-agent init "构建一个带博客功能的个人作品集网站"

# 指定完整技术栈
harness-agent init "电商产品页面" --stack react-fastapi --output ./my-project

# 分别指定前后端技术栈
harness-agent init "电商管理系统" \
  --frontend react-vite-tailwind \
  --backend fastapi-sqlalchemy \
  --database postgresql
```

#### 2. 恢复现有项目
```bash
harness-agent resume ./existing-project
```

#### 3. 质量评估
```bash
harness-agent evaluate ./project-path
```

#### 4. 查看支持的技术栈
```bash
harness-agent stacks list
```

### 工作流程
1. **需求输入**：用户通过 CLI 提供自然语言需求
2. **规划阶段**：PlannerAgent 生成详细规格和技术方案
3. **冲刺契约**：明确每个开发阶段的验收标准，对齐代理预期
4. **生成阶段**：GeneratorAgent 按 sprint 实现功能
5. **评估阶段**：EvaluatorAgent 从四个维度评分并给出反馈
6. **迭代优化**：根据评分结果自动决定是通过、细化还是重新设计
7. **交付**：生成完整可运行项目、质量报告和文档

### 输出产物
- 完整可运行的全栈应用源码
- Git 提交历史记录
- 四维质量评估报告
- 多端响应式截图
- 性能测试报告
- 项目文档

---

## 技术栈支持
- **前端**：React/Vue/Angular/Svelte/Next.js/Nuxt/Astro/Vanilla JS
- **后端**：Node.js/Express/NestJS/Python/FastAPI/Go/Java/Rust
- **数据库**：MySQL/PostgreSQL/MongoDB/Redis/SQLite/Supabase
- 支持自动根据项目复杂度选择单体或前后端分离架构
