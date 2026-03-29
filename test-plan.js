#!/usr/bin/env node

const { PlannerAgent } = require('./dist/agents/PlannerAgent');
require('dotenv').config();

async function testPlanCreation() {
  console.log('Testing createProjectPlan...');
  const planner = new PlannerAgent();
  await planner.initialize();

  const spec = {
    title: "Test Portfolio",
    description: "A simple portfolio website",
    requirements: {},
    techStack: { frontend: "react-nextjs", backend: null, database: null, fullStack: "react-nextjs", isSeparate: false },
    architecture: { isSeparateFrontendBackend: false, components: [], dataFlow: "" },
    designGuidelines: { colorScheme: "", typography: "", designSystem: "", responsive: false }
  };

  try {
    const start = Date.now();
    const plan = await planner.createProjectPlan(spec);
    const duration = Date.now() - start;
    console.log(`✓ Plan created in ${duration}ms`);
    console.log(`  Total sprints: ${plan.totalSprints}`);
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('  Stack:', error.stack);
  }
}

testPlanCreation();
