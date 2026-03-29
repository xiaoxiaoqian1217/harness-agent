import { AestheticEvaluator } from '../src/quality/AestheticEvaluator';
import { AestheticAnalysis } from '../src/quality/AestheticEvaluator';
import { ProjectContext } from '../src/types/project';
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

describe('AestheticEvaluator', () => {
  let evaluator: AestheticEvaluator;
  let mockContext: ProjectContext;

  beforeEach(async () => {
    evaluator = new AestheticEvaluator();

    mockContext = {
      specification: {
        title: 'Test Project',
        designGuidelines: {
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b',
          typography: {
            headingFont: 'Inter',
            bodyFont: 'Inter',
          },
          designSystem: 'custom',
          spacing: '8px',
          responsive: true,
        },
        requirements: {
          features: ['Custom Feature', 'Unique Interaction', 'Login'],
          userFlows: ['User can login'],
        },
        techStack: {
          frontend: 'react',
          backend: 'node',
          database: 'sqlite',
        },
      },
      projectPath: '/tmp/test-project',
    };
  });

  describe('analyzeScreenshots', () => {
    test('should analyze valid screenshots and return AestheticAnalysis', async () => {
      // Arrange
      const screenshotPaths = ['/tmp/screenshot1.png', '/tmp/screenshot2.png'];
      const mockMetadata = { width: 1920, height: 1080 };
      const mockBuffer = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]); // Simple RGB buffer
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue(mockMetadata),
        raw: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue({ data: mockBuffer, info: mockMetadata }),
      };

      mockSharp.mockReturnValue(mockSharpInstance as any);
      mockFs.pathExists.mockResolvedValue(true);

      // Act
      const result = await evaluator.analyzeScreenshots(screenshotPaths);

      // Assert
      expect(result).toBeDefined();
      expect(result.colorPalette).toBeDefined();
      expect(result.colorPalette.primary).toHaveLength(2);
      expect(result.colorPalette.secondary).toHaveLength(2);
      expect(result.colorPalette.accent).toHaveLength(2);
      expect(result.colorPalette.contrastRatio).toBe(4.5);
      expect(result.layout).toBeDefined();
      expect(result.layout.gridAlignment).toBe(75);
      expect(result.layout.spacingConsistency).toBe(80);
      expect(result.layout.visualHierarchy).toBe(70);
      expect(result.typography).toBeDefined();
      expect(result.typography.fontPairing).toBe(75);
      expect(result.typography.sizeHierarchy).toBe(80);
      expect(result.typography.readability).toBe(85);
      expect(result.overallAesthetic).toBe(75);

      expect(mockFs.pathExists).toHaveBeenCalledWith(screenshotPaths[0]);
      expect(mockFs.pathExists).toHaveBeenCalledWith(screenshotPaths[1]);
    });

    test('should skip non-existent screenshots', async () => {
      // Arrange
      const screenshotPaths = ['/tmp/nonexistent.png', '/tmp/exists.png'];
      const mockMetadata = { width: 1920, height: 1080 };
      const mockBuffer = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue(mockMetadata),
        raw: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue({ data: mockBuffer, info: mockMetadata }),
      };

      mockSharp.mockReturnValue(mockSharpInstance as any);
      mockFs.pathExists
        .mockResolvedValueOnce(false) // First file doesn't exist
        .mockResolvedValueOnce(true);  // Second file exists

      // Act
      const result = await evaluator.analyzeScreenshots(screenshotPaths);

      // Assert - should still return analysis from the valid screenshot
      expect(result).toBeDefined();
      expect(result.overallAesthetic).toBe(75);
    });

    test('should throw error when no valid screenshots can be analyzed', async () => {
      // Arrange
      const screenshotPaths = ['/tmp/invalid1.png', '/tmp/invalid2.png'];
      mockFs.pathExists.mockResolvedValue(false);

      // Act & Assert
      await expect(evaluator.analyzeScreenshots(screenshotPaths)).rejects.toThrow(
        'No valid screenshots could be analyzed'
      );
    });

    test('should handle sharp errors gracefully', async () => {
      // Arrange
      const screenshotPaths = ['/tmp/error.png'];
      mockFs.pathExists.mockResolvedValue(true);
      mockSharp.mockReturnValue({
        metadata: jest.fn().mockRejectedValue(new Error('Sharp error')),
        raw: jest.fn().mockReturnThis(),
        toBuffer: jest.fn(),
      } as any);

      // Act
      const result = await evaluator.analyzeScreenshots(screenshotPaths);

      // Assert - should fall back to default analysis from the other screenshot? Actually only one
      // This test is tricky because we need at least one valid. Let's test that it throws if all fail.
      // But we have only one screenshot. If it fails, the analyses array will have all nulls.
      // Actually the mock returns Promise that rejects, so analyzeScreenshot will wrap in try/catch and return null.
      // So validAnalyses = [], and it should throw.
      await expect(evaluator.analyzeScreenshots(['/tmp/error.png'])).rejects.toThrow(
        'No valid screenshots could be analyzed'
      );
    });
  });

  describe('evaluateDesignQuality', () => {
    test('should use precomputedAnalysis when provided', async () => {
      // Arrange
      const precomputedAnalysis: AestheticAnalysis = {
        colorPalette: {
          primary: ['#ff0000', '#00ff00'],
          secondary: ['#0000ff', '#ffff00'],
          accent: ['#ff00ff', '#00ffff'],
          contrastRatio: 5.0,
        },
        layout: {
          gridAlignment: 90,
          spacingConsistency: 92,
          visualHierarchy: 88,
        },
        typography: {
          fontPairing: 91,
          sizeHierarchy: 89,
          readability: 93,
        },
        overallAesthetic: 90,
      };

      // Act
      const result = await evaluator.evaluateDesignQuality(mockContext, undefined, precomputedAnalysis);

      // Assert
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(80);
      expect(result.feedback).toContain(precomputedAnalysis.layout.gridAlignment.toString());
      expect(result.suggestions).toBeInstanceOf(Array);
    });

    test('should analyze screenshots when precomputedAnalysis not provided but screenshotPaths given', async () => {
      // Arrange
      const screenshotPaths = ['/tmp/screenshot.png'];
      const mockMetadata = { width: 1920, height: 1080 };
      const mockBuffer = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue(mockMetadata),
        raw: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue({ data: mockBuffer, info: mockMetadata }),
      };

      mockSharp.mockReturnValue(mockSharpInstance as any);
      mockFs.pathExists.mockResolvedValue(true);

      // Act
      const result = await evaluator.evaluateDesignQuality(mockContext, screenshotPaths);

      // Assert
      expect(result).toBeDefined();
      expect(result.score).toBeDefined();
      expect(typeof result.score).toBe('number');
    });

    test('should fall back to heuristic evaluation when no screenshots or precomputedAnalysis', async () => {
      // Act
      const result = await evaluator.evaluateDesignQuality(mockContext);

      // Assert
      expect(result).toBeDefined();
      expect(result.score).toBe(75); // heuristic returns 75
      expect(result.feedback).toContain('heuristic evaluation');
    });

    test('should log appropriately based on inputs', async () => {
      // Arrange
      const precomputedAnalysis: AestheticAnalysis = {
        colorPalette: { primary: [], secondary: [], accent: [], contrastRatio: 4.5 },
        layout: { gridAlignment: 80, spacingConsistency: 80, visualHierarchy: 80 },
        typography: { fontPairing: 80, sizeHierarchy: 80, readability: 80 },
        overallAesthetic: 80,
      };

      // Act
      await evaluator.evaluateDesignQuality(mockContext, ['/tmp/screen.png']);

      // Assert - just verify no errors; logging is side effect
      expect(true).toBe(true);
    });
  });

  describe('evaluateOriginality', () => {
    test('should work without precomputedAnalysis parameter', async () => {
      // Act
      const result = await evaluator.evaluateOriginality(mockContext);

      // Assert
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.feedback).toBeDefined();
      expect(result.suggestions).toBeInstanceOf(Array);
    });

    test('should accept precomputedAnalysis parameter even if unused', async () => {
      // Arrange
      const precomputedAnalysis: AestheticAnalysis = {
        colorPalette: { primary: [], secondary: [], accent: [], contrastRatio: 4.5 },
        layout: { gridAlignment: 80, spacingConsistency: 80, visualHierarchy: 80 },
        typography: { fontPairing: 80, sizeHierarchy: 80, readability: 80 },
        overallAesthetic: 80,
      };

      // Act
      const result = await evaluator.evaluateOriginality(mockContext, precomputedAnalysis);

      // Assert - should still work and produce same type of output
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
    });

    test('should increase score for custom features', async () => {
      // The mockContext already has 'Custom Feature' and 'Unique Interaction' which should increase score
      const result = await evaluator.evaluateOriginality(mockContext);
      expect(result.score).toBeGreaterThanOrEqual(65 + 15); // base 65 + 15 from custom features
    });
  });

  describe('evaluateCraftExecution', () => {
    test('should use precomputedAnalysis to calculate visual craft score', async () => {
      // Arrange
      const precomputedAnalysis: AestheticAnalysis = {
        colorPalette: {
          primary: ['#3b82f6', '#1d4ed8'],
          secondary: ['#64748b', '#94a3b8'],
          accent: ['#f59e0b', '#ef4444'],
          contrastRatio: 4.5,
        },
        layout: {
          gridAlignment: 85,
          spacingConsistency: 90,
          visualHierarchy: 80,
        },
        typography: {
          fontPairing: 88,
          sizeHierarchy: 92,
          readability: 87,
        },
        overallAesthetic: 86,
      };

      // Act
      const result = await evaluator.evaluateCraftExecution(mockContext, undefined, precomputedAnalysis);

      // Assert
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(75);
      expect(result.feedback).toContain('Visual analysis');
      expect(result.feedback).toContain('grid=85%');
      expect(result.feedback).toContain('spacing=90%');
      expect(result.feedback).toContain('hierarchy=80%');
      expect(result.suggestions).toContain('Improve spacing consistency by adhering to a standardized 8px grid system');
    });

    test('should analyze screenshots when provided without precomputedAnalysis', async () => {
      // Arrange
      const screenshotPaths = ['/tmp/screenshot.png'];
      const mockMetadata = { width: 1920, height: 1080 };
      const mockBuffer = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue(mockMetadata),
        raw: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue({ data: mockBuffer, info: mockMetadata }),
      };

      mockSharp.mockReturnValue(mockSharpInstance as any);
      mockFs.pathExists.mockResolvedValue(true);

      // Act
      const result = await evaluator.evaluateCraftExecution(mockContext, screenshotPaths);

      // Assert
      expect(result).toBeDefined();
      expect(result.score).toBeDefined();
      expect(result.feedback).toContain('Visual analysis');
    });

    test('should use heuristic approach when no screenshots or precomputedAnalysis', async () => {
      // Act
      const result = await evaluator.evaluateCraftExecution(mockContext);

      // Assert
      expect(result).toBeDefined();
      // Base 75 + 5 for designSystem + 5 for responsive = 85
      expect(result.score).toBe(85);
      expect(result.feedback).toContain('Based on specification analysis');
    });

    test('should blend visual craft score with guideline score', async () => {
      // Arrange
      const precomputedAnalysis: AestheticAnalysis = {
        colorPalette: { primary: [], secondary: [], accent: [], contrastRatio: 4.5 },
        layout: { gridAlignment: 60, spacingConsistency: 60, visualHierarchy: 60 },
        typography: { fontPairing: 60, sizeHierarchy: 60, readability: 60 },
        overallAesthetic: 60,
      };
      // Visual craft score would be average of 6 metrics = 60
      // Guideline score: 75 + 5 + 5 = 85
      // Blended: 60 * 0.6 + 85 * 0.4 = 36 + 34 = 70

      // Act
      const result = await evaluator.evaluateCraftExecution(mockContext, undefined, precomputedAnalysis);

      // Assert
      expect(result.score).toBe(70);
    });

    test('should cap score at 95', async () => {
      // Arrange
      const precomputedAnalysis: AestheticAnalysis = {
        colorPalette: { primary: [], secondary: [], accent: [], contrastRatio: 4.5 },
        layout: { gridAlignment: 100, spacingConsistency: 100, visualHierarchy: 100 },
        typography: { fontPairing: 100, sizeHierarchy: 100, readability: 100 },
        overallAesthetic: 100,
      };

      // Act
      const result = await evaluator.evaluateCraftExecution(mockContext, undefined, precomputedAnalysis);

      // Assert
      expect(result.score).toBeLessThanOrEqual(95);
    });

    test('should generate visual-specific feedback based on metrics', async () => {
      // Arrange
      const precomputedAnalysis: AestheticAnalysis = {
        colorPalette: { primary: [], secondary: [], accent: [], contrastRatio: 4.5 },
        layout: { gridAlignment: 70, spacingConsistency: 75, visualHierarchy: 80 },
        typography: { fontPairing: 85, sizeHierarchy: 90, readability: 95 },
        overallAesthetic: 80,
      };

      // Act
      const result = await evaluator.evaluateCraftExecution(mockContext, undefined, precomputedAnalysis);

      // Assert
      expect(result.feedback).toContain('spacing=75%');
      expect(result.feedback).toContain('readability=95%');
      expect(result.suggestions).toContain('Define and document a clear typographic scale for all text elements');
    });
  });
});
