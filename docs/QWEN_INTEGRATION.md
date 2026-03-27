# 千问（Qwen）模型集成指南

## 概述

Harness Agent 已完整支持阿里云千问（Qwen）系列模型，可通过 OpenAI 兼容 API 无缝使用。

## 配置步骤

### 1. 获取 API Key

访问 [阿里云 DashScope](https://dashscope.aliyun.com/) 并获取 API Key。

### 2. 设置环境变量

在项目根目录的 `.env` 文件中添加：

```env
# 千问配置
QWEN_API_KEY=your-qwen-api-key-here
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1  # 可选，默认值

# 指定使用的千问模型（可选）
QWEN_MODEL=qwen-turbo  # 或 qwen-plus, qwen-max 等
```

或者在运行前设置环境变量：

```bash
# PowerShell
$env:QWEN_API_KEY="your-api-key-here"
$env:QWEN_MODEL="qwen-turbo"

# Bash
export QWEN_API_KEY="your-api-key-here"
export QWEN_MODEL="qwen-turbo"
```

### 3. 指定代理使用千问模型

Harness Agent 支持为不同代理配置不同模型。有几种方式：

#### 方式一：通过环境变量全局配置

```env
# 使用千问作为所有代理的默认模型
QWEN_MODEL=qwen-turbo

# 或者使用 Claude（默认）
# ANTHROPIC_API_KEY=your-claude-key
```

#### 方式二：混合使用多模型（推荐）

```env
# Planner 使用 Claude（规划需要高精度）
ANTHROPIC_API_KEY=claude-key
PLANNER_MODEL=claude-3-opus-20240229

# Generator 使用千问（成本更低）
QWEN_API_KEY=qwen-key
GENERATOR_MODEL=qwen-turbo

# Evaluator 使用 Claude（评审需要高质量）
ANTHROPIC_API_KEY=claude-key
EVALUATOR_MODEL=claude-3-sonnet-20240229
```

#### 方式三：在代码中显式指定（高级用法）

```typescript
import { LLMClientFactory } from './src/core/llm';
import { AgentConfig } from './src/types/agent';

// 为不同代理创建指定模型的客户端
const plannerConfig: AgentConfig = {
  model: 'qwen-turbo',
  temperature: 0.1,
  maxTokens: 4096,
};

const plannerClient = await LLMClientFactory.createClient('qwen', plannerConfig);
```

## 支持的千问模型

| 模型 | 描述 | 适用代理 | 建议温度 |
|------|------|----------|----------|
| `qwen-turbo` | 快速响应，成本最低 | Generator | 0.7 |
| `qwen-plus` | 平衡型，性能较好 | Generator/Evaluator | 0.3-0.7 |
| `qwen-max` | 最强大，接近 Claude | Planner/Evaluator | 0.1-0.3 |
| `qwen-max-longcontext` | 支持超长上下文 | Planner（复杂需求） | 0.1 |

**推荐配置**：
- **PlannerAgent**: `qwen-max` + temperature 0.1（需要精准规划）
- **GeneratorAgent**: `qwen-turbo` + temperature 0.7（creative 代码生成）
- **EvaluatorAgent**: `qwen-plus` + temperature 0.3（平衡质量和成本）

## 环境变量对照表

| 代理类型 | 模型选择 | 温度控制 | API Key |
|---------|---------|---------|---------|
| `PLANNER_MODEL` | Planner 模型 | `PLANNER_TEMPERATURE` | `ANTHROPIC_API_KEY` 或 `QWEN_API_KEY` |
| `GENERATOR_MODEL` | Generator 模型 | `GENERATOR_TEMPERATURE` | `ANTHROPIC_API_KEY` 或 `QWEN_API_KEY` |
| `EVALUATOR_MODEL` | Evaluator 模型 | `EVALUATOR_TEMPERATURE` | `ANTHROPIC_API_KEY` 或 `QWEN_API_KEY` |

**注意**：
- 当模型以 `claude-` 开头时，使用 Anthropic API 和 `ANTHROPIC_API_KEY`
- 当模型以 `qwen-` 开头时，使用 DashScope API 和 `QWEN_API_KEY`
- 如果未指定模型，默认使用 Claude Opus

## 使用示例

### 示例 1：完全使用千问

```bash
# 设置千问 API Key
export QWEN_API_KEY="your-qwen-api-key"
export QWEN_MODEL="qwen-turbo"

# 运行项目
npm run dev init "Build a personal portfolio website with blog functionality" \
  --frontend react-vite \
  --backend node-express
```

### 示例 2：混合模型（推荐）

```bash
# Planner 使用 Claude（高质量规划）
export ANTHROPIC_API_KEY="claude-key"
export PLANNER_MODEL="claude-3-opus-20240229"

# Generator 使用千问（降低成本）
export QWEN_API_KEY="qwen-key"
export GENERATOR_MODEL="qwen-turbo"

# Evaluator 使用 Claude Sonnet（平衡）
export EVALUATOR_MODEL="claude-3-sonnet-20240229"

npm run dev init "Build a personal portfolio website"
```

### 示例 3：恢复项目时指定模型

```bash
# 使用千问继续开发
export QWEN_API_KEY="your-key"
export GENERATOR_MODEL="qwen-plus"

npm run dev resume ./my-project
```

## 成本对比（参考）

| 模型 | 每 1K tokens（输入/输出） | 适用场景 |
|------|------------------------|----------|
| Claude Opus | ~$0.015 / ~$0.075 | 规划、评审（高质量场景） |
| Claude Sonnet | ~$0.003 / ~$0.015 | 通用场景 |
| Qwen-Max | ~¥0.04 / ~¥0.12（约 $0.0056 / $0.017） | 高质量场景，成本更低 |
| Qwen-Plus | ~¥0.0056 / ~¥0.0168（约 $0.0008 / $0.0024） | 平衡场景 |
| Qwen-Turbo | ~¥0.0014 / ~¥0.0042（约 $0.0002 / $0.0006） | 大量生成，成本最优 |

**节省成本建议**：
- 使用千问进行 Generator 的代码生成工作，可节省 **60-80%** 成本
- 使用 Claude 进行 Planner 的规划工作，保证架构质量
- 根据项目需求动态调整模型选择

## Playwright MCP 支持

千问适配器**完全支持** Playwright MCP 的所有功能：

✅ 浏览器自动化截图
✅ E2E 测试场景执行
✅ 多视口测试
✅ 性能指标收集
✅ 可访问性检查

**为什么？** Playwright 是代码层面的 API 调用，与使用哪种 LLM 无关。无论使用 Claude、Qwen、OpenAI，TestOrchestrator 中的 Playwright 功能都能正常工作。

## 故障排除

### QWEN_API_KEY not found
```
Error: QWEN_API_KEY environment variable is not set
```
**解决**: 检查 `.env` 文件或环境变量是否正确设置。

### 模型不存在
```
Error: Unsupported model: qwen-unknown
```
**解决**: 确认模型名称正确。有效值：`qwen-turbo`, `qwen-plus`, `qwen-max`, `qwen-max-longcontext`

### API 调用失败
```
Error: Request failed with status 401
```
**解决**: API Key 可能无效或已过期，请重新获取。

### 上下文长度超限
```
Error: Context length exceeded
```
**解决**:
- 使用 `qwen-max-longcontext` 模型
- 或优化提示词长度
- 或启用上下文压缩功能（即将实现）

## 技术实现细节

QwenClient 实现了标准的 `LLMClient` 接口：

```typescript
interface LLMClient {
  initialize(config: AgentConfig): Promise<void>;
  generateResponse(prompt, systemPrompt?, context?): Promise<AgentResponse>;
  generateResponseWithTools(prompt, tools, systemPrompt?, context?): Promise<AgentResponse & { toolCalls?: any[] }>;
  getModelName(): string;
  cleanup(): Promise<void>;
}
```

- **基础 URL**: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- **认证**: Bearer Token (API Key)
- **协议**: OpenAI 兼容 API
- **请求格式**: 标准的 OpenAI chat completion 格式

## 后续扩展

要添加更多模型（如 OpenAI、Doubao）：
1. 创建新的 `XxxClient.ts` 实现 `LLMClient` 接口
2. 在 `LLMClientFactory.ts` 中添加对应 case
3. 更新 `LLMProvider` 枚举
4. 添加相应的环境变量支持

---

最后更新: 2025-03-27
