import { AestheticEvaluator } from '../src/quality/AestheticEvaluator';
import { AestheticAnalysis } from '../src/quality/AestheticEvaluator';
import fs from 'fs-extra';
import sharp from 'sharp';

// Mock dependencies
jest.mock('fs-extra');
jest.mock('sharp');
jest.mock('winston', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
  }),
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockSharp = sharp as jest.MockedFunction<typeof sharp>;

describe('AestheticEvaluator - Simplified Tests', () => {
  let evaluator: AestheticEvaluator;

  beforeEach(() => {
    evaluator = new AestheticEvaluator();
  });

  describe('analyzeScreenshots', () => {
    test('should analyze valid screenshots and return analysis', async () => {
      const screenshotPaths = ['/tmp/screenshot.png'];
      const mockMetadata = { width: 1920, height: 1080 };
      const mockBuffer = Buffer.from([1, 2, 3]);

      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue(mockMetadata),
        raw: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue({ data: mockBuffer, info: mockMetadata }),
      };

      mockSharp.mockReturnValue(mockSharpInstance as any);
      mockFs.pathExists.mockResolvedValue(true);

      const result = await evaluator.analyzeScreenshots(screenshotPaths);

      expect(result).toBeDefined();
      expect(result.overallAesthetic).toBeGreaterThan(0);
    });

    test('should handle missing screenshots gracefully', async () => {
      const screenshotPaths = ['/tmp/nonexistent.png'];
      mockFs.pathExists.mockResolvedValue(false);

      await expect(evaluator.analyzeScreenshots(screenshotPaths)).rejects.toThrow(
        'No valid screenshots could be analyzed'
      );
    });
  });

  describe('evaluateDesignQuality', () => {
    test('should return score with precomputed analysis', async () => {
      const precomputedAnalysis: AestheticAnalysis = {
        colorPalette: { primary: [], secondary: [], accent: [], contrastRatio: 4.5 },
        layout: { gridAlignment: 80, spacingConsistency: 80, visualHierarchy: 80 },
        typography: { fontPairing: 80, sizeHierarchy: 80, readability: 80 },
        overallAesthetic: 80,
      };

      const context = {} as any; // Simplified context
      const result = await evaluator.evaluateDesignQuality(context, [], precomputedAnalysis);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(70);
    });

    test('should fall back to heuristic when no screenshots', async () => {
      const context = {} as any;
      const result = await evaluator.evaluateDesignQuality(context);

      expect(result).toBeDefined();
      expect(result.score).toBe(75); // heuristic baseline
    });
  });

  describe('evaluateCraftExecution', () => {
    test('should use visual analysis when available', async () => {
      const precomputedAnalysis: AestheticAnalysis = {
        colorPalette: { primary: [], secondary: [], accent: [], contrastRatio: 4.5 },
        layout: { gridAlignment: 85, spacingConsistency: 90, visualHierarchy: 80 },
        typography: { fontPairing: 88, sizeHierarchy: 92, readability: 87 },
        overallAesthetic: 86,
      };

      const context = {} as any;
      const result = await evaluator.evaluateCraftExecution(context, [], precomputedAnalysis);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(80);
    });
  });

  describe('evaluateOriginality', () => {
    test('should evaluate originality based on features', async () => {
      const context = {} as any;
      const result = await evaluator.evaluateOriginality(context);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(50);
    });
  });
});
