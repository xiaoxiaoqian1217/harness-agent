# Model Switching Guide

## Problem Fixed

The original error "Unexpected end of JSON input" was caused by two issues:

1. **Missing error handling**: Agents didn't check if LLM responses failed before trying to parse JSON
2. **Hardcoded provider mismatch**: Generator and Evaluator were configured to use Qwen API but with Claude model names, causing 404 errors

## Current State

- ✅ All agents now properly check `response.success` before parsing JSON
- ✅ Actual LLM errors are surfaced with clear messages (e.g., "API Error: 404 Not Found")
- ✅ Each agent's LLM provider is configurable via environment variables

## How to Switch Models

Edit your `.env` file:

```bash
# Select LLM provider for each agent (options: claude, qwen, openai, doubao)
PLANNER_PROVIDER=qwen
GENERATOR_PROVIDER=claude
EVALUATOR_PROVIDER=claude

# Set model names (provider-specific)
CLAUDE_MODEL=claude-3-opus-20240229
QWEN_MODEL=qwen3.5-flash

# API keys (required for chosen providers)
ANTHROPIC_API_KEY=your_claude_key_here
QWEN_API_KEY=your_qwen_key_here
```

## Example Configurations

### Budget Option (All Qwen)
```bash
PLANNER_PROVIDER=qwen
GENERATOR_PROVIDER=qwen
EVALUATOR_PROVIDER=qwen
QWEN_MODEL=qwen3.5-flash
```

### Premium Option (All Claude)
```bash
PLANNER_PROVIDER=claude
GENERATOR_PROVIDER=claude
EVALUATOR_PROVIDER=claude
CLAUDE_MODEL=claude-3-opus-20240229
```

### Balanced (Qwen planner, Claude generator/evaluator)
```bash
PLANNER_PROVIDER=qwen
GENERATOR_PROVIDER=claude
EVALUATOR_PROVIDER=claude
QWEN_MODEL=qwen3.5-flash
CLAUDE_MODEL=claude-3-sonnet-20240229  # cheaper Claude model
```

## Troubleshooting

**Error: "The model X does not exist"**
- You're using the wrong model name for the provider
- Check provider-specific model names in documentation

**Error: "API key not set"**
- Set the appropriate API key for your chosen provider
- `ANTHROPIC_API_KEY` for Claude
- `QWEN_API_KEY` for Qwen

**Error: "Unsupported LLM provider"**
- Check spelling of provider name (must be: claude, qwen, openai, doubao)
- Provider must be added to `LLMClientFactory.ts` if new
