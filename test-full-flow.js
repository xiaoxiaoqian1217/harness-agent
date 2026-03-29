#!/usr/bin/env node

const { PlannerAgent } = require('./dist/agents/PlannerAgent');
require('dotenv').config();

async function testFullFlow() {
  const planner = new PlannerAgent();
  await planner.initialize();

  const start = Date.now();
  try {
    const result = await planner.execute({
      requirement: 'Build a simple portfolio website',
      outputPath: './test-project'
    });

    if (result.success) {
      const duration = (Date.now() - start) / 1000;
      console.log(`\n✓ Planning completed in ${duration}s`);
      console.log(`  Title: ${result.context.specification.title}`);
      console.log(`  Sprints: ${result.context.plan.totalSprints}`);
    } else {
      console.error('✗ Failed:', result.error);
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

testFullFlow();
