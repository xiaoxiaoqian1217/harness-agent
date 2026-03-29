#!/usr/bin/env node

const { PlannerAgent } = require('./dist/agents/PlannerAgent');
require('dotenv').config();

async function testRawResponse() {
  try {
    console.log('Testing LLM response...');

    // Test environment
    console.log('QWEN_API_KEY length:', process.env.QWEN_API_KEY ? process.env.QWEN_API_KEY.length : 0);
    console.log('ANTHROPIC_API_KEY length:', process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.length : 0);

    console.log('\nInitializing planner agent...');
    const planner = new PlannerAgent();
    await planner.initialize();

    console.log('Planner initialized, LLM client type:', planner.llmClient.constructor.name);

    const prompt = `
Analyze the following project requirements and convert them into a structured format.

Raw requirements:
Build a personal portfolio website with blog functionality

Return ONLY a valid JSON object with the following structure:
{
  "title": "Short project title",
  "description": "Detailed project description",
  "features": ["List of core features"],
  "technicalRequirements": ["List of technical requirements (performance, security, etc.)"],
  "designRequirements": ["List of design/aesthetic requirements"]
}
    `.trim();

    console.log('\nCalling generateResponse...');
    const response = await planner.llmClient.generateResponse(prompt);

    console.log('\n=== FULL RESPONSE OBJECT ===');
    console.log(JSON.stringify(response, (key, value) => {
      if (key === 'content') {
        return value ? (value.length > 200 ? value.substring(0, 200) + '...' : value) : '(empty)';
      }
      return value;
    }, 2));

    console.log('\n=== CONTENT ONLY ===');
    console.log('content:', response.content);
    console.log('content length:', response.content?.length || 0);
    console.log('success:', response.success);
    if (response.error) {
      console.error('error:', response.error);
    }

    if (response.content && response.content.trim()) {
      try {
        const parsed = JSON.parse(response.content);
        console.log('JSON parsed successfully:', parsed);
      } catch (e) {
        console.error('JSON parse failed:', e.message);
      }
    } else {
      console.error('Empty content - cannot parse JSON');
    }

  } catch (error) {
    console.error('ERROR:', error);
    console.error('Stack:', error.stack);
  }
}

testRawResponse();
