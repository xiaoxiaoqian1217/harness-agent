import { ContextManager } from '../src/governance/ContextManager';

// Mock fs
const mockFs = {
  mkdirp: jest.fn().mockResolvedValue(undefined),
  pathExists: jest.fn().mockResolvedValue(false),
  readJson: jest.fn(),
  writeJson: jest.fn().mockResolvedValue(undefined),
};
jest.mock('fs-extra', () => mockFs);

jest.mock('winston', () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

describe('ContextManager - Simplified Tests', () => {
  let manager: ContextManager;

  beforeEach(() => {
    manager = new ContextManager();
    jest.clearAllMocks();
  });

  describe('compressContext', () => {
    test('should return original if under limit', async () => {
      const result = await manager.compressContext('Small context', 100);

      expect(result.content).toBe('Small context');
      expect(result.compressionRatio).toBe(1);
    });

    test('should compress large context', async () => {
      const largeContext = 'Lorem ipsum '.repeat(1000);
      const result = await manager.compressContext(largeContext, 500);

      expect(result.compressedSizeTokens).toBeLessThan(500);
      expect(result.preservedElements).toBeDefined();
    });
  });

  describe('generateStateTransferDocument', () => {
    test('should create STD document', async () => {
      const context = {
        specification: { title: 'Test Project' },
        state: { currentSprint: 1 },
      } as any;

      const std = await manager.generateStateTransferDocument(context, 'Previous context', ['Lesson 1']);

      expect(std.projectId).toBeDefined();
      expect(std.snapshot.specification.title).toBe('Test Project');
      expect(std.lessonsLearned).toContain('Lesson 1');
    });
  });

  describe('saveState and loadState', () => {
    test('should save and load state', async () => {
      const state = { test: 'data' };
      await manager.saveState(state, '/tmp/test.json');

      mockFs.readJson.mockResolvedValue(state);
      const loaded = await manager.loadState('/tmp/test.json');

      expect(loaded).toEqual(state);
    });
  });
});
