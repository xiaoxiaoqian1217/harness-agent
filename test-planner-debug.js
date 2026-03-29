#!/usr/bin/env node

const { PlannerAgent } = require('./dist/agents/PlannerAgent');
require('dotenv').config();

async function testPlanner() {
  try {
    console.log('Initializing planner agent...');
    const planner = new PlannerAgent();
    await planner.initialize();

    console.log('Testing requirement analysis...');
    const result = await planner.analyzeRequirements('Build a personal portfolio website with blog functionality');

    console.log('SUCCESS:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('ERROR:', error);
    console.error('Stack:', error.stack);
    if (error instanceof SyntaxError) {
      console.error('This is a JSON parsing error. The LLM response is likely not valid JSON.');
    }
  }
}

testPlanner();
