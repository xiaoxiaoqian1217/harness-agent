// Set required environment variables for tests
process.env.PLANNER_TEMPERATURE = '0.1';
process.env.GENERATOR_TEMPERATURE = '0.7';
process.env.EVALUATOR_TEMPERATURE = '0.3';
process.env.MIN_PASS_SCORE = '85';
process.env.PIVOT_THRESHOLD = '60';
process.env.MAX_ITERATIONS = '5';
process.env.DEFAULT_WORKSPACE = './workspace';
process.env.PLAYWRIGHT_HEADLESS = 'true';
process.env.PLAYWRIGHT_VIEWPORT_WIDTH = '1920';
process.env.PLAYWRIGHT_VIEWPORT_HEIGHT = '1080';

console.log('Test environment configured');
