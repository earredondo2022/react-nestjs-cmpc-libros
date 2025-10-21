import { Test, TestingModule } from '@nestjs/testing';
import { BatchOperationsService, BatchBookData, BatchOperationOptions } from './batch-operations.service';
import { getModelToken } from '@nestjs/sequelize';
import { Book } from '../../books/entities/book.entity';
import { Author } from '../../authors/entities/author.entity';
import { Publisher } from '../../publishers/entities/publisher.entity';
import { Genre } from '../../genres/entities/genre.entity';
import { TransactionService } from './transaction.service';
import { AuditService } from '../../audit/audit.service';
import { BadRequestException } from '@nestjs/common';

describe('BatchOperationsService', () => {
  let service: BatchOperationsService;
  let mockBookModel: any;
  let mockAuthorModel: any;
  let mockPublisherModel: any;
  let mockGenreModel: any;
  let mockTransactionService: any;
  let mockAuditService: any;

  beforeEach(async () => {
    mockBookModel = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      bulkCreate: jest.fn(),
      findAll: jest.fn(),
    };

    mockAuthorModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      findOrCreate: jest.fn(),
    };

    mockPublisherModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      findOrCreate: jest.fn(),
    };

    mockGenreModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      findOrCreate: jest.fn(),
    };

    mockTransactionService = {
      runInTransaction: jest.fn().mockImplementation((callback) => callback({})),
    };

    mockAuditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchOperationsService,
        {
          provide: getModelToken(Book),
          useValue: mockBookModel,
        },
        {
          provide: getModelToken(Author),
          useValue: mockAuthorModel,
        },
        {
          provide: getModelToken(Publisher),
          useValue: mockPublisherModel,
        },
        {
          provide: getModelToken(Genre),
          useValue: mockGenreModel,
        },
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

    service = module.get<BatchOperationsService>(BatchOperationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('importBooksFromCsv', () => {
    it('should handle empty CSV data gracefully', async () => {
      const csvData = 'title,isbn,price';
      
      try {
        await service.importBooksFromCsv(csvData);
      } catch (error) {
        expect(error.message).toContain('CSV must have at least header and one data row');
      }
    });

    it('should process valid CSV data', async () => {
      const csvData = `title,isbn,price
Test Book,123456789,19.99`;

      mockAuthorModel.findOrCreate.mockResolvedValue([{ id: 1, name: 'Unknown' }, false]);
      mockPublisherModel.findOrCreate.mockResolvedValue([{ id: 1, name: 'Unknown' }, false]);
      mockGenreModel.findOrCreate.mockResolvedValue([{ id: 1, name: 'Unknown' }, false]);
      mockBookModel.findOne.mockResolvedValue(null);
      mockBookModel.create.mockResolvedValue({ id: 1, title: 'Test Book' });

      const result = await service.importBooksFromCsv(csvData);

      expect(result.totalProcessed).toBe(1);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should handle invalid CSV format', async () => {
      const csvData = 'invalid,csv,format\nno,proper,headers';

      try {
        await service.importBooksFromCsv(csvData);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });

    it('should validate CSV data when validateOnly is true', async () => {
      const csvData = `title,isbn,price
Test Book,123456789,19.99`;

      const options: BatchOperationOptions = {
        validateOnly: true,
      };

      const result = await service.importBooksFromCsv(csvData, options);

      expect(result.totalProcessed).toBe(1);
      expect(mockBookModel.create).not.toHaveBeenCalled();
    });

    it('should handle transaction errors', async () => {
      const csvData = `title,isbn,price
Test Book,123456789,19.99`;

      mockTransactionService.runInTransaction.mockRejectedValue(new Error('Transaction failed'));

      try {
        await service.importBooksFromCsv(csvData);
      } catch (error) {
        expect(error.message).toBe('Transaction failed');
      }
    });
  });

  describe('bulkUpdateBooks', () => {
    it('should update multiple books', async () => {
      const updates = [
        { id: '1', updates: { title: 'Updated Book 1' } },
        { id: '2', updates: { title: 'Updated Book 2' } },
      ];

      mockBookModel.findByPk.mockResolvedValue({ id: 1, update: jest.fn() });

      const result = await service.bulkUpdateBooks(updates);

      expect(result.totalProcessed).toBe(2);
      expect(mockTransactionService.runInTransaction).toHaveBeenCalled();
    });

    it('should handle update errors gracefully', async () => {
      const updates = [
        { id: '1', updates: { title: 'Updated Book 1' } },
        { id: '999', updates: { title: 'Non-existent Book' } },
      ];

      mockBookModel.findByPk
        .mockResolvedValueOnce({ id: 1, update: jest.fn() })
        .mockResolvedValueOnce(null);

      const result = await service.bulkUpdateBooks(updates);

      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('bulkDeleteBooks', () => {
    it('should delete multiple books by IDs', async () => {
      const ids = ['1', '2', '3'];
      mockBookModel.findByPk.mockResolvedValue({ id: 1, title: 'Test Book' });
      mockBookModel.destroy.mockResolvedValue(3);

      const result = await service.bulkDeleteBooks(ids);

      expect(result.totalProcessed).toBe(3);
      expect(result.successful).toBe(3);
      expect(mockBookModel.destroy).toHaveBeenCalled();
    });

    it('should handle bulk delete with continue on error', async () => {
      const ids = ['1', '2'];
      const options = { continueOnError: true };
      
      mockBookModel.findByPk.mockResolvedValue({ id: 1, title: 'Test Book' });
      mockBookModel.destroy.mockResolvedValue(2);

      const result = await service.bulkDeleteBooks(ids, options);

      expect(result.successful).toBe(2);
      expect(mockBookModel.destroy).toHaveBeenCalled();
    });
  });
});