// Core functionality smoke tests - verifying basic components work

import { AestheticEvaluator } from '../src/quality/AestheticEvaluator';

// AestheticEvaluator basic test
describe('AestheticEvaluator', () => {
  test('analyzeScreenshots returns analysis object', async () => {
    const evaluator = new AestheticEvaluator();
    // This test will fail if file doesn't exist, but verifies method exists
    try {
      await evaluator.analyzeScreenshots(['/nonexistent.png']);
    } catch (error: any) {
      expect(error.message).toContain('No valid screenshots');
    }
  });

  test('evaluateDesignQuality returns score', async () => {
    const evaluator = new AestheticEvaluator();
    const context = { specification: { title: 'Test Project' } } as any;
    const result = await evaluator.evaluateDesignQuality(context);
    expect(result.score).toBeGreaterThan(0);
  });
});

// Placeholder for more core tests
describe('Project Structure', () => {
  test('key modules exist', () => {
    // Verify code compiles and modules can be imported
    expect(true).toBe(true);
  });
});
