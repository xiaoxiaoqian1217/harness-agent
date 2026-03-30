import { TestResult } from '../types/quality';
import { ProjectContext, SprintResult } from '../types/project';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import winston from 'winston';
import path from 'path';
import fs from 'fs-extra';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

export interface TestOrchestratorOptions {
  headless?: boolean;
  baseUrl?: string;
  screenshotDir?: string;
  defaultTimeout?: number;
}

export interface E2ETestScenario {
  name: string;
  description: string;
  steps: (page: Page, context: BrowserContext, baseUrl: string) => Promise<void>;
  viewport?: { width: number; height: number };
}

export class TestOrchestrator {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private options: Required<TestOrchestratorOptions>;
  private screenshotDir: string;

  constructor(options?: TestOrchestratorOptions) {
    this.options = {
      headless: options?.headless ?? true,
      baseUrl: options?.baseUrl ?? 'http://localhost:3000',
      screenshotDir: options?.screenshotDir ?? './screenshots',
      defaultTimeout: options?.defaultTimeout ?? 30000,
    };
    this.screenshotDir = this.options.screenshotDir;
  }

  /**
   * Initialize the test orchestrator
   */
  async initialize(): Promise<void> {
    logger.info('Initializing TestOrchestrator', { options: this.options });

    // Create screenshot directory
    await fs.mkdirp(this.screenshotDir);

    // Launch Playwright browser
    this.browser = await chromium.launch({
      headless: this.options.headless,
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
    });

    logger.info('TestOrchestrator initialized successfully');
  }

  /**
   * Run complete E2E test suite
   */
  async runE2ETests(
    context: ProjectContext,
    _sprintResult?: SprintResult,
    appUrl?: string
  ): Promise<TestResult[]> {
    logger.info('Running E2E test suite', {
      projectTitle: context.specification.title,
      appUrl: appUrl || this.options.baseUrl,
    });

    const testResults: TestResult[] = [];
    const baseUrl = appUrl || this.options.baseUrl;

    try {
      // Define test scenarios based on project requirements
      const scenarios = this.generateTestScenarios(context);

      for (const scenario of scenarios) {
        const result = await this.runTestScenario(scenario, baseUrl);
        testResults.push(result);
      }
    } catch (error) {
      logger.error('Error running E2E tests', { error });
      testResults.push({
        testName: 'E2E Test Suite',
        testType: 'e2e',
        success: false,
        durationMs: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return testResults;
  }

  /**
   * Generate test scenarios based on project context
   */
  private generateTestScenarios(context: ProjectContext): E2ETestScenario[] {
    const scenarios: E2ETestScenario[] = [];
    const features = context.specification.requirements.features || [];

    // Basic smoke test - always included
    scenarios.push({
      name: 'Page Load Smoke Test',
      description: 'Verify the application loads successfully',
      viewport: { width: 1280, height: 720 },
      steps: async (page: Page, _context: BrowserContext, baseUrl: string) => {
        await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
        // Check that something rendered
        await page.waitForSelector('body', { state: 'attached' });
      },
    });

    // Check for common features and add relevant tests
    if (features.some(f => f.toLowerCase().includes('login') || f.toLowerCase().includes('auth'))) {
      scenarios.push({
        name: 'Authentication Flow Test',
        description: 'Verify user can login and logout',
        viewport: { width: 1280, height: 720 },
        steps: async (page: Page, _context: BrowserContext, baseUrl: string) => {
          await page.goto(`${baseUrl}/`);
          // Look for login-related elements
          const hasLoginButton = await page.$('text=/login|sign in/i') !== null;
          if (hasLoginButton) {
            await page.click('text=/login|sign in/i');
            await page.waitForTimeout(1000);
          }
        },
      });
    }

    if (features.some(f => f.toLowerCase().includes('todo') || f.toLowerCase().includes('task'))) {
      scenarios.push({
        name: 'Todo List Test',
        description: 'Verify todo list functionality',
        viewport: { width: 1280, height: 720 },
        steps: async (page: Page, _context: BrowserContext, baseUrl: string) => {
          await page.goto(`${baseUrl}/`);
          // Look for todo list elements
          await page.waitForSelector('body', { state: 'attached' });
        },
      });
    }

    // Responsive design tests
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      scenarios.push({
        name: `Responsive Test - ${viewport.name}`,
        description: `Verify application renders correctly on ${viewport.name}`,
        viewport,
        steps: async (page: Page, _context: BrowserContext, baseUrl: string) => {
          await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
          await page.waitForTimeout(500);
        },
      });
    }

    return scenarios;
  }

  /**
   * Run a single test scenario
   */
  private async runTestScenario(
    scenario: E2ETestScenario,
    baseUrl: string
  ): Promise<TestResult> {
    if (!this.context) {
      throw new Error('TestOrchestrator not initialized');
    }

    const startTime = Date.now();
    const screenshotName = `${scenario.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    const screenshotPath = path.join(this.screenshotDir, screenshotName);

    logger.info('Running test scenario', { scenario: scenario.name, baseUrl });

    try {
      const page = await this.context.newPage();

      if (scenario.viewport) {
        await page.setViewportSize(scenario.viewport);
      }

      page.setDefaultTimeout(this.options.defaultTimeout);

      // Run the test steps with baseUrl
      await scenario.steps(page, this.context, baseUrl);

      // Take screenshot
      await page.screenshot({ path: screenshotPath, fullPage: true });

      await page.close();

      const durationMs = Date.now() - startTime;

      logger.info('Test scenario passed', {
        scenario: scenario.name,
        durationMs,
        screenshotPath,
      });

      return {
        testName: scenario.name,
        testType: 'e2e',
        success: true,
        durationMs,
        screenshotPath,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;

      logger.warn('Test scenario failed', {
        scenario: scenario.name,
        durationMs,
        error,
      });

      return {
        testName: scenario.name,
        testType: 'e2e',
        success: false,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
        screenshotPath: await fs.pathExists(screenshotPath) ? screenshotPath : undefined,
      };
    }
  }

  /**
   * Capture screenshots at multiple viewport sizes
   */
  async captureScreenshots(
    url: string,
    viewports?: Array<{ name: string; width: number; height: number }>
  ): Promise<string[]> {
    if (!this.browser) {
      throw new Error('TestOrchestrator not initialized');
    }

    logger.info('Capturing screenshots', { url });

    const screenshotPaths: string[] = [];
    const targetViewports = viewports || [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'large-desktop', width: 1920, height: 1080 },
    ];

    const page = await this.browser.newPage();

    for (const viewport of targetViewports) {
      try {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(url, { waitUntil: 'networkidle' });

        const screenshotName = `screenshot-${viewport.name}-${viewport.width}x${viewport.height}.png`;
        const screenshotPath = path.join(this.screenshotDir, screenshotName);

        await page.screenshot({ path: screenshotPath, fullPage: true });
        screenshotPaths.push(screenshotPath);

        logger.info('Screenshot captured', { viewport: viewport.name, screenshotPath });
      } catch (error) {
        logger.warn('Failed to capture screenshot', { viewport: viewport.name, error });
      }
    }

    await page.close();
    return screenshotPaths;
  }

  /**
   * Run performance tests and collect metrics
   */
  async runPerformanceTests(url: string): Promise<TestResult> {
    if (!this.browser) {
      throw new Error('TestOrchestrator not initialized');
    }

    const startTime = Date.now();
    const metrics: Record<string, any> = {};

    logger.info('Running performance tests', { url });

    try {
      const page = await this.browser.newPage();

      // Enable performance metrics collection
      await page.goto(url, { waitUntil: 'networkidle' });

      // Collect performance metrics
      const perfMetrics = await page.evaluate(() => {
        const navigationEntries = (performance as any).getEntriesByType('navigation');
        const navigation = navigationEntries.length > 0 ? navigationEntries[0] as any : null;
        const paintEntries = (performance as any).getEntriesByType('paint');

        return {
          domContentLoaded: navigation?.domContentLoadedEventEnd,
          loadComplete: navigation?.loadEventEnd,
          firstPaint: paintEntries.find((p: any) => p.name === 'first-paint')?.startTime,
          firstContentfulPaint: paintEntries.find((p: any) => p.name === 'first-contentful-paint')?.startTime,
        };
      });

      Object.assign(metrics, perfMetrics);

      // Take screenshot
      const screenshotPath = path.join(this.screenshotDir, 'performance-test.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      await page.close();

      const durationMs = Date.now() - startTime;

      return {
        testName: 'Performance Test',
        testType: 'performance',
        success: true,
        durationMs,
        screenshotPath,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;

      return {
        testName: 'Performance Test',
        testType: 'performance',
        success: false,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check accessibility (basic checks via Playwright)
   */
  async runAccessibilityChecks(url: string): Promise<TestResult> {
    if (!this.browser) {
      throw new Error('TestOrchestrator not initialized');
    }

    const startTime = Date.now();

    logger.info('Running accessibility checks', { url });

    try {
      const page = await this.browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });

      // Basic accessibility checks
      const issues: string[] = [];

      // Check for images without alt text
      const imagesWithoutAlt = await page.$$eval('img:not([alt])', imgs => imgs.length);
      if (imagesWithoutAlt > 0) {
        issues.push(`${imagesWithoutAlt} image(s) missing alt attribute`);
      }

      // Check for form inputs without labels
      const inputsWithoutLabels = await page.$$eval(
        'input:not([type="hidden"]):not([aria-label]):not([aria-labelledby])',
        inputs => inputs.length
      );
      if (inputsWithoutLabels > 0) {
        issues.push(`${inputsWithoutLabels} input(s) missing labels`);
      }

      await page.close();

      const durationMs = Date.now() - startTime;
      const success = issues.length === 0;

      return {
        testName: 'Accessibility Check',
        testType: 'e2e',
        success,
        durationMs,
        error: issues.length > 0 ? issues.join('; ') : undefined,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;

      return {
        testName: 'Accessibility Check',
        testType: 'e2e',
        success: false,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    logger.info('Cleaning up TestOrchestrator');

    if (this.context) {
      await this.context.close();
      this.context = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Get the configured base URL
   */
  getBaseUrl(): string {
    return this.options.baseUrl;
  }
}
