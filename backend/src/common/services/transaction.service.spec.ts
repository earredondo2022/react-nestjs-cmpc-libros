import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { getConnectionToken } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';

describe('TransactionService', () => {
  let service: TransactionService;
  let sequelize: any;
  let mockTransaction: any;

  beforeEach(async () => {
    mockTransaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };

    sequelize = {
      transaction: jest.fn().mockResolvedValue(mockTransaction),
      query: jest.fn().mockResolvedValue(undefined),
      config: {
        database: 'test_db',
        pool: { max: 10 },
      },
      getDialect: jest.fn().mockReturnValue('postgres'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getConnectionToken(),
          useValue: sequelize,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runInTransaction', () => {
    it('should commit transaction when callback succeeds', async () => {
      const callback = jest.fn().mockResolvedValue('success');

      const result = await service.runInTransaction(callback);

      expect(sequelize.transaction).toHaveBeenCalledWith({
        isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
      });
      expect(callback).toHaveBeenCalledWith(mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('should rollback transaction when callback fails', async () => {
      const error = new Error('Callback failed');
      const callback = jest.fn().mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(service.runInTransaction(callback)).rejects.toThrow(error);

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(mockTransaction);
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Transaction rolled back due to error:', error);

      consoleSpy.mockRestore();
    });

    it('should use custom isolation level', async () => {
      const callback = jest.fn().mockResolvedValue('success');

      await service.runInTransaction(callback, Transaction.ISOLATION_LEVELS.SERIALIZABLE);

      expect(sequelize.transaction).toHaveBeenCalledWith({
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      });
    });
  });

  describe('createTransaction', () => {
    it('should create a manual transaction with default isolation level', async () => {
      const result = await service.createTransaction();

      expect(sequelize.transaction).toHaveBeenCalledWith({
        isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
      });
      expect(result).toBe(mockTransaction);
    });

    it('should create a manual transaction with custom isolation level', async () => {
      const result = await service.createTransaction(Transaction.ISOLATION_LEVELS.REPEATABLE_READ);

      expect(sequelize.transaction).toHaveBeenCalledWith({
        isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
      });
      expect(result).toBe(mockTransaction);
    });
  });

  describe('runInParallelTransaction', () => {
    it('should execute all callbacks in parallel successfully', async () => {
      const callback1 = jest.fn().mockResolvedValue('result1');
      const callback2 = jest.fn().mockResolvedValue('result2');
      const callback3 = jest.fn().mockResolvedValue('result3');

      const results = await service.runInParallelTransaction([callback1, callback2, callback3]);

      expect(callback1).toHaveBeenCalledWith(mockTransaction);
      expect(callback2).toHaveBeenCalledWith(mockTransaction);
      expect(callback3).toHaveBeenCalledWith(mockTransaction);
      expect(results).toEqual(['result1', 'result2', 'result3']);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should rollback if any callback fails', async () => {
      const callback1 = jest.fn().mockResolvedValue('result1');
      const callback2 = jest.fn().mockRejectedValue(new Error('Failed'));
      const callback3 = jest.fn().mockResolvedValue('result3');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        service.runInParallelTransaction([callback1, callback2, callback3])
      ).rejects.toThrow('Failed');

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('runInSequentialTransaction', () => {
    it('should execute all callbacks in sequence successfully', async () => {
      const callback1 = jest.fn().mockResolvedValue('result1');
      const callback2 = jest.fn().mockResolvedValue('result2');
      const callback3 = jest.fn().mockResolvedValue('result3');

      const results = await service.runInSequentialTransaction([callback1, callback2, callback3]);

      expect(callback1).toHaveBeenCalledWith(mockTransaction);
      expect(callback2).toHaveBeenCalledWith(mockTransaction);
      expect(callback3).toHaveBeenCalledWith(mockTransaction);
      expect(results).toEqual(['result1', 'result2', 'result3']);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should rollback if any callback fails in sequence', async () => {
      const callback1 = jest.fn().mockResolvedValue('result1');
      const callback2 = jest.fn().mockRejectedValue(new Error('Failed'));
      const callback3 = jest.fn().mockResolvedValue('result3');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        service.runInSequentialTransaction([callback1, callback2, callback3])
      ).rejects.toThrow('Failed');

      expect(callback1).toHaveBeenCalledWith(mockTransaction);
      expect(callback2).toHaveBeenCalledWith(mockTransaction);
      expect(callback3).not.toHaveBeenCalled(); // Should not execute after failure
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('runWithSavepoint', () => {
    it('should create and release savepoint on success', async () => {
      const callback = jest.fn().mockResolvedValue('success');
      const savepointName = 'test_savepoint';

      const result = await service.runWithSavepoint(mockTransaction, savepointName, callback);

      expect(sequelize.query).toHaveBeenCalledWith(`SAVEPOINT ${savepointName}`, { transaction: mockTransaction });
      expect(callback).toHaveBeenCalledWith(mockTransaction);
      expect(sequelize.query).toHaveBeenCalledWith(`RELEASE SAVEPOINT ${savepointName}`, { transaction: mockTransaction });
      expect(result).toBe('success');
    });

    it('should rollback to savepoint on error', async () => {
      const error = new Error('Callback failed');
      const callback = jest.fn().mockRejectedValue(error);
      const savepointName = 'test_savepoint';

      await expect(
        service.runWithSavepoint(mockTransaction, savepointName, callback)
      ).rejects.toThrow(error);

      expect(sequelize.query).toHaveBeenCalledWith(`SAVEPOINT ${savepointName}`, { transaction: mockTransaction });
      expect(callback).toHaveBeenCalledWith(mockTransaction);
      expect(sequelize.query).toHaveBeenCalledWith(`ROLLBACK TO SAVEPOINT ${savepointName}`, { transaction: mockTransaction });
    });
  });

  describe('getConnectionStats', () => {
    it('should return connection statistics', async () => {
      const stats = await service.getConnectionStats();

      expect(stats).toEqual({
        databaseName: 'test_db',
        dialect: 'postgres',
        connectionPoolMax: 10,
      });
    });

    it('should handle missing configuration values', async () => {
      sequelize.config = { database: undefined, pool: undefined };
      sequelize.getDialect.mockReturnValue(null);

      const stats = await service.getConnectionStats();

      expect(stats).toEqual({
        databaseName: 'unknown',
        dialect: 'unknown',
        connectionPoolMax: 5,
      });
    });
  });

  describe('runInTransactionWithTimeout', () => {
    it('should complete transaction before timeout', async () => {
      const callback = jest.fn().mockResolvedValue('success');

      const result = await service.runInTransactionWithTimeout(callback, 5000);

      expect(result).toBe('success');
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should timeout if transaction takes too long', async () => {
      const callback = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      await expect(
        service.runInTransactionWithTimeout(callback, 50)
      ).rejects.toThrow('Transaction timeout after 50ms');
    });

    it('should use default timeout', async () => {
      const callback = jest.fn().mockResolvedValue('success');

      const result = await service.runInTransactionWithTimeout(callback);

      expect(result).toBe('success');
    });

    it('should use custom isolation level with timeout', async () => {
      const callback = jest.fn().mockResolvedValue('success');

      await service.runInTransactionWithTimeout(
        callback, 
        5000, 
        Transaction.ISOLATION_LEVELS.SERIALIZABLE
      );

      expect(sequelize.transaction).toHaveBeenCalledWith({
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      });
    });
  });

  describe('error handling', () => {
    it('should handle transaction creation failure', async () => {
      const error = new Error('Transaction creation failed');
      sequelize.transaction.mockRejectedValue(error);
      const callback = jest.fn();

      await expect(service.runInTransaction(callback)).rejects.toThrow(error);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle commit failure', async () => {
      const commitError = new Error('Commit failed');
      mockTransaction.commit.mockRejectedValue(commitError);
      const callback = jest.fn().mockResolvedValue('success');

      await expect(service.runInTransaction(callback)).rejects.toThrow(commitError);

      expect(callback).toHaveBeenCalledWith(mockTransaction);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should handle rollback failure', async () => {
      const callbackError = new Error('Callback failed');
      const rollbackError = new Error('Rollback failed');
      mockTransaction.rollback.mockRejectedValue(rollbackError);
      const callback = jest.fn().mockRejectedValue(callbackError);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(service.runInTransaction(callback)).rejects.toThrow(rollbackError);

      expect(callback).toHaveBeenCalledWith(mockTransaction);
      expect(mockTransaction.rollback).toHaveBeenCalled();
      // Note: console.log is mocked in setup, so we don't expect it to be called

      consoleSpy.mockRestore();
    });
  });
});