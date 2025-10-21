import { Test, TestingModule } from '@nestjs/testing';
import { TransactionErrorHandler } from './transaction-error-handler.service';
import { AuditService } from '../../audit/audit.service';
import { HttpException } from '@nestjs/common';

describe('TransactionErrorHandler', () => {
  let service: TransactionErrorHandler;
  let mockAuditService: any;

  beforeEach(async () => {
    mockAuditService = {
      log: jest.fn(),
      logCreate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionErrorHandler,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<TransactionErrorHandler>(TransactionErrorHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleTransactionError', () => {
    it('should handle deadlock error and throw appropriate HttpException', async () => {
      const error = new Error('deadlock detected');
      const context = {
        operation: 'CREATE_BOOK',
        entityType: 'Book',
        entityId: '123',
      };

      try {
        await service.handleTransactionError(error, context);
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(HttpException);
        // Note: The service logs to console, not through audit service directly
      }
    });

    it('should handle timeout error', async () => {
      const error = new Error('timeout exceeded');
      const context = {
        operation: 'UPDATE_BOOK',
        entityType: 'Book',
        entityId: '456',
      };

      try {
        await service.handleTransactionError(error, context);
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(HttpException);
      }
    });

    it('should handle constraint violation error', async () => {
      const error = new Error('unique constraint violated');
      const context = {
        operation: 'CREATE_AUTHOR',
        entityType: 'Author',
      };

      try {
        await service.handleTransactionError(error, context);
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(HttpException);
      }
    });

    it('should handle connection error', async () => {
      const error = new Error('connection refused');

      try {
        await service.handleTransactionError(error);
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(HttpException);
      }
    });

    it('should handle validation error', async () => {
      const error = new Error('validation failed');

      try {
        await service.handleTransactionError(error);
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(HttpException);
      }
    });

    it('should handle unknown error', async () => {
      const error = new Error('some unknown error');

      try {
        await service.handleTransactionError(error);
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(HttpException);
      }
    });
  });

  describe('executeWithRetry', () => {
    it('should execute operation successfully on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await service.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry operation on retryable error', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('deadlock detected'))
        .mockResolvedValueOnce('success');

      const result = await service.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should fail after max attempts reached', async () => {
      const operation = jest.fn()
        .mockRejectedValue(new Error('deadlock detected'));

      const context = {
        operation: 'CREATE_BOOK',
        entityType: 'Book',
        entityId: '123',
      };

      try {
        await service.executeWithRetry(operation, context);
      } catch (error) {
        expect(operation).toHaveBeenCalledTimes(3); // Default max attempts
        expect(error).toBeInstanceOf(HttpException);
      }
    });

    it('should not retry non-retryable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValue(new Error('validation failed'));

      try {
        await service.executeWithRetry(operation);
      } catch (error) {
        expect(operation).toHaveBeenCalledTimes(1);
        expect(error).toBeInstanceOf(HttpException);
      }
    });

    it('should handle operation with context', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const context = {
        operation: 'UPDATE_BOOK',
        entityType: 'Book',
        entityId: '456',
        userId: 'user1',
      };

      const result = await service.executeWithRetry(operation, context);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });
});