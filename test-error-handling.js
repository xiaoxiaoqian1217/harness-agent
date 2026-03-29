#!/usr/bin/env node

const { PlannerAgent } = require('./dist/agents/PlannerAgent');
require('dotenv').config();

async function testErrorHandling() {
  console.log('Testing what happens when LLM returns failure...\n');

  // Simulate the scenario by directly checking the code
  const planner = new PlannerAgent();
  await planner.initialize();

  // Mock a failing response to see how it's handled
  console.log('If the LLM returns { success: false, content: "", error: "404" },');
  console.log('the code will try: JSON.parse("") which throws "Unexpected end of JSON input"');
  console.log('This is NOT the actual error - it masks the real problem!\n');

  // Demonstrate
  try {
    JSON.parse('');
  } catch (e) {
    console.log('Error from empty string:', e.message);
  }

  console.log('\nThe fix: check response.success and throw the actual error!');
}

testErrorHandling();
