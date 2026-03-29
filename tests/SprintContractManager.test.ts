import { SprintContractManager } from '../src/governance/SprintContractManager';

// Mock winston
jest.mock('winston', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

describe('SprintContractManager - Simplified Tests', () => {
  let manager: SprintContractManager;
  let mockSprint: any;

  beforeEach(() => {
    manager = new SprintContractManager();

    mockSprint = {
      id: 'sprint-1',
      sprintNumber: 1,
      title: 'Test Sprint',
      description: 'A test sprint',
      tasks: [
        {
          id: 'task-1',
          title: 'Implement user authentication',
          description: 'Add login and registration',
          estimatedHours: 8,
          acceptanceCriteria: ['User can login'],
        },
      ],
      deliverables: ['src/components/Auth.tsx'],
      durationDays: 5,
    };
  });

  describe('draftContract', () => {
    test('should create a valid sprint contract', async () => {
      const contract = await manager.draftContract(mockSprint);

      expect(contract).toBeDefined();
      expect(contract.sprintId).toBe('sprint-1');
      expect(contract.sprintNumber).toBe(1);
      expect(contract.status).toBe('draft');
    });

    test('should generate clauses for tasks and deliverables', async () => {
      const contract = await manager.draftContract(mockSprint);

      expect(contract.clauses.length).toBeGreaterThan(0);
      expect(contract.clauses.some((c: any) => c.id.startsWith('task-'))).toBe(true);
    });

    test('should include quality thresholds', async () => {
      const contract = await manager.draftContract(mockSprint);

      expect(contract.qualityThresholds.minimumOverallScore).toBe(85);
    });
  });

  describe('signContract', () => {
    test('should allow signing and update status', async () => {
      const contract = await manager.draftContract(mockSprint);
      const signed = await manager.signContract(contract.sprintId, 'generator', {});

      expect(signed.status).toBe('signed');
      expect(signed.signing.signedBy.generator).toBeDefined();
    });

    test('should not allow re-signing', async () => {
      const contract = await manager.draftContract(mockSprint);
      await manager.signContract(contract.sprintId, 'generator', {});

      await expect(
        manager.signContract(contract.sprintId, 'generator', {})
      ).rejects.toThrow();
    });
  });

  describe('validateContract', () => {
    test('should require all signatures', async () => {
      const contract = await manager.draftContract(mockSprint);
      const validation = await manager.validateContract(contract.sprintId);

      expect(validation.isValid).toBe(false);
      expect(validation.missingClauses.length).toBeGreaterThan(0);
    });

    test('should pass when fully signed', async () => {
      const contract = await manager.draftContract(mockSprint);
      await manager.signContract(contract.sprintId, 'generator', {});
      await manager.signContract(contract.sprintId, 'evaluator', {});

      const validation = await manager.validateContract(contract.sprintId);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('getActiveContract', () => {
    test('should return contract if exists', async () => {
      const contract = await manager.draftContract(mockSprint);
      const retrieved = manager.getActiveContract(contract.sprintId);

      expect(retrieved).toEqual(contract);
    });

    test('should return undefined for non-existent', () => {
      const retrieved = manager.getActiveContract('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });
});
