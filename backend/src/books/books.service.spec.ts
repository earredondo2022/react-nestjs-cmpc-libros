import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service';
import { getModelToken } from '@nestjs/sequelize';
import { Book } from './entities/book.entity';
import { Author } from '../authors/entities/author.entity';
import { Publisher } from '../publishers/entities/publisher.entity';
import { Genre } from '../genres/entities/genre.entity';
import { AuditService } from '../audit/audit.service';
import { TransactionService } from '../common/services/transaction.service';
import { Op } from 'sequelize';

describe('BooksService', () => {
  let service: BooksService;
  let bookModel: any;
  let auditService: AuditService;
  let transactionService: TransactionService;

  const mockBook = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Book',
    isbn: '978-0123456789',
    price: 29.99,
    stockQuantity: 10,
    isAvailable: true,
    authorId: 'author-id',
    publisherId: 'publisher-id',
    genreId: 'genre-id',
    publicationDate: new Date(),
    pages: 300,
    description: 'Test description',
    imageUrl: 'test-image.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    save: jest.fn().mockResolvedValue(this),
    destroy: jest.fn().mockResolvedValue(this),
    update: jest.fn().mockResolvedValue(this),
    toJSON: jest.fn().mockReturnValue({
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Test Book',
      isbn: '978-0123456789',
      price: 29.99,
      stockQuantity: 10,
      isAvailable: true,
      authorId: 'author-id',
      publisherId: 'publisher-id',
      genreId: 'genre-id',
      publicationDate: new Date(),
      pages: 300,
      description: 'Test description',
      imageUrl: 'test-image.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }),
  } as any;

  const mockAuthor = {
    id: 'author-id',
    name: 'Test Author',
  };

  const mockPublisher = {
    id: 'publisher-id',
    name: 'Test Publisher',
  };

  const mockGenre = {
    id: 'genre-id',
    name: 'Test Genre',
  };

  const mockBookModel = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    destroy: jest.fn(),
    update: jest.fn(),
    findAndCountAll: jest.fn(),
  };

  const mockAuditService = {
    logCreate: jest.fn(),
    logUpdate: jest.fn(),
    logDelete: jest.fn(),
    logExport: jest.fn(),
    logCreateWithTransaction: jest.fn(),
    logUpdateWithTransaction: jest.fn(),
    logDeleteWithTransaction: jest.fn(),
  };

  const mockTransactionService = {
    runInTransaction: jest.fn().mockImplementation((callback) => callback()),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: getModelToken(Book),
          useValue: mockBookModel,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    bookModel = module.get(getModelToken(Book));
    auditService = module.get<AuditService>(AuditService);
    transactionService = module.get<TransactionService>(TransactionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new book', async () => {
      const createBookDto = {
        title: 'Test Book',
        isbn: '978-0123456789',
        price: 29.99,
        stockQuantity: 10,
        isAvailable: true,
        authorId: 'author-id',
        publisherId: 'publisher-id',
        genreId: 'genre-id',
      };

      const auditContext = {
        userId: 'user-id',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      };

      mockBookModel.create.mockResolvedValue(mockBook);
      mockAuditService.logCreate.mockResolvedValue({});

      const result = await service.create(createBookDto, auditContext);

      expect(mockBookModel.create).toHaveBeenCalledWith(createBookDto, { transaction: undefined });
      expect(mockAuditService.logCreateWithTransaction).toHaveBeenCalledWith({
        userId: auditContext.userId,
        tableName: 'books',
        recordId: mockBook.id,
        newValues: mockBook.toJSON(),
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        description: `Libro creado: "${createBookDto.title}"`,
      }, undefined);
      expect(result).toEqual(mockBook);
    });

    it('should throw error if book creation fails', async () => {
      const createBookDto = {
        title: 'Test Book',
        price: 29.99,
        stockQuantity: 10,
      };

      const auditContext = {
        userId: 'user-id',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      };

      mockBookModel.create.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createBookDto, auditContext)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    const mockResult = {
      rows: [mockBook],
      count: 1,
    };

    it('should return paginated books without filters', async () => {
      mockBookModel.findAndCountAll.mockResolvedValue(mockResult);

      const result = await service.findAll(1, 10);

      expect(mockBookModel.findAndCountAll).toHaveBeenCalledWith({
        include: [
          { model: Author, attributes: ['id', 'name'] },
          { model: Publisher, attributes: ['id', 'name'] },
          { model: Genre, attributes: ['id', 'name'] },
        ],
        where: {},
        limit: 10,
        offset: 0,
        order: [['created_at', 'DESC']],
      });
      expect(result).toEqual({
        books: mockResult.rows,
        total: mockResult.count,
      });
    });

    it('should return filtered books', async () => {
      const filters = {
        title: 'Test',
        authorId: 'author-id',
        isAvailable: 'true',
      };

      mockBookModel.findAndCountAll.mockResolvedValue(mockResult);

      const result = await service.findAll(1, 10, filters);

      expect(mockBookModel.findAndCountAll).toHaveBeenCalledWith({
        include: [
          { model: Author, attributes: ['id', 'name'] },
          { model: Publisher, attributes: ['id', 'name'] },
          { model: Genre, attributes: ['id', 'name'] },
        ],
        where: {
          title: { [Op.iLike]: '%Test%' },
          author_id: 'author-id',
          is_available: true,
        },
        limit: 10,
        offset: 0,
        order: [['created_at', 'DESC']],
      });
      expect(result).toEqual({
        books: mockResult.rows,
        total: mockResult.count,
      });
    });

    it('should handle custom sorting', async () => {
      mockBookModel.findAndCountAll.mockResolvedValue(mockResult);

      await service.findAll(1, 10, {}, 'title', 'ASC');

      expect(mockBookModel.findAndCountAll).toHaveBeenCalledWith({
        include: [
          { model: Author, attributes: ['id', 'name'] },
          { model: Publisher, attributes: ['id', 'name'] },
          { model: Genre, attributes: ['id', 'name'] },
        ],
        where: {},
        limit: 10,
        offset: 0,
        order: [['title', 'ASC']],
      });
    });
  });

  describe('findById', () => {
    it('should return a book by id', async () => {
      mockBookModel.findByPk.mockResolvedValue(mockBook);

      const result = await service.findById('123e4567-e89b-12d3-a456-426614174000');

      expect(mockBookModel.findByPk).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', {
        include: [
          { model: Author, attributes: ['id', 'name'] },
          { model: Publisher, attributes: ['id', 'name'] },
          { model: Genre, attributes: ['id', 'name'] },
        ],
      });
      expect(result).toEqual(mockBook);
    });

    it('should return null if book not found', async () => {
      mockBookModel.findByPk.mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a book', async () => {
      const updateData = {
        title: 'Updated Title',
        price: 39.99,
      };

      const auditContext = {
        userId: 'user-id',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      };

      const updatedBook = { ...mockBook, ...updateData };

      // Mock service.findById for getting old values
      jest.spyOn(service, 'findById').mockResolvedValue(mockBook);
      
      // Mock the update method to return affected rows count
      mockBookModel.update.mockResolvedValue([1]);
      
      // Mock findByPk for getting updated book
      mockBookModel.findByPk.mockResolvedValue(updatedBook);
      
      mockAuditService.logUpdateWithTransaction.mockResolvedValue({});

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateData, auditContext);

      expect(mockBookModel.update).toHaveBeenCalledWith(updateData, {
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
        transaction: undefined,
      });
      expect(mockBookModel.findByPk).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', {
        include: [
          { model: Author, attributes: ['id', 'name'] },
          { model: Publisher, attributes: ['id', 'name'] },
          { model: Genre, attributes: ['id', 'name'] }
        ],
        transaction: undefined,
      });
      expect(result).toEqual(updatedBook);
    });

    it('should return null if book not found for update', async () => {
      const auditContext = {
        userId: 'user-id',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      };

      // Mock service.findById to return null (book not found for audit)
      jest.spyOn(service, 'findById').mockResolvedValue(null);
      
      // Mock update to return 0 affected rows
      mockBookModel.update.mockResolvedValue([0]);

      const result = await service.update('non-existent-id', { title: 'Updated' }, auditContext);
      
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should delete a book', async () => {
      const auditContext = {
        userId: 'user-id',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      };

      // Mock service.findById for getting book data for audit
      jest.spyOn(service, 'findById').mockResolvedValue(mockBook);
      
      mockBookModel.destroy.mockResolvedValue(1);
      mockAuditService.logDeleteWithTransaction.mockResolvedValue({});

      const result = await service.remove('123e4567-e89b-12d3-a456-426614174000', auditContext);

      expect(mockBookModel.destroy).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
        transaction: undefined,
      });
      expect(result).toBe(true);
    });

    it('should return false if book not found for deletion', async () => {
      const auditContext = {
        userId: 'user-id',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      };

      // Mock service.findById to return null (book not found for audit)
      jest.spyOn(service, 'findById').mockResolvedValue(null);
      
      // Mock destroy to return 0 (no rows affected)
      mockBookModel.destroy.mockResolvedValue(0);

      const result = await service.remove('non-existent-id', auditContext);
      
      expect(result).toBe(false);
    });
  });

  describe('exportToCsv', () => {
    it('should export books to CSV format', async () => {
      const booksWithAssociations = [
        {
          ...mockBook,
          author: mockAuthor,
          publisher: mockPublisher,
          genre: mockGenre,
        },
      ];

      const auditContext = {
        userId: 'user-id',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      };

      mockBookModel.findAll.mockResolvedValue(booksWithAssociations);
      mockAuditService.logExport.mockResolvedValue({});

      const result = await service.exportToCsv({}, auditContext);

      expect(mockBookModel.findAll).toHaveBeenCalled();
      expect(mockAuditService.logExport).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: auditContext.userId,
          tableName: 'books',
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      );
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});