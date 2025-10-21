import { Test, TestingModule } from '@nestjs/testing';
import { TransactionMiddleware } from './transaction.middleware';
import { TransactionService } from '../services/transaction.service';
import { AuditService } from '../../audit/audit.service';

describe('TransactionMiddleware', () => {
  let middleware: TransactionMiddleware;
  let transactionService: jest.Mocked<TransactionService>;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    const mockTransactionService = {
      runInTransaction: jest.fn(),
    };

    const mockAuditService = {
      logAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionMiddleware,
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    middleware = module.get<TransactionMiddleware>(TransactionMiddleware);
    transactionService = module.get(TransactionService);
    auditService = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should have transaction service', () => {
    expect(transactionService).toBeDefined();
  });

  it('should have audit service', () => {
    expect(auditService).toBeDefined();
  });
});