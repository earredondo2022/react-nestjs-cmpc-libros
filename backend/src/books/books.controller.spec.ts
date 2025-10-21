import { Test, TestingModule } from '@nestjs/testing';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BadRequestException } from '@nestjs/common';

describe('BooksController', () => {
  let controller: BooksController;
  let service: BooksService;

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
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockBooksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    exportToCsv: jest.fn(),
    uploadImage: jest.fn(),
    getBookImage: jest.fn(),
  };

  const mockRequest = {
    user: { id: 'user-id' },
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'test-agent' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [
        {
          provide: BooksService,
          useValue: mockBooksService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BooksController>(BooksController);
    service = module.get<BooksService>(BooksService);
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

      mockBooksService.create.mockResolvedValue(mockBook);

      const result = await controller.create(createBookDto, undefined, mockRequest as any);

      expect(mockBooksService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: createBookDto.title,
          price: createBookDto.price,
          stockQuantity: createBookDto.stockQuantity,
        }),
        expect.objectContaining({
          userId: 'user-id',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        })
      );
      expect(result).toEqual(mockBook);
    });

    it('should create a book with image file', async () => {
      const createBookDto = {
        title: 'Test Book with Image',
        price: 29.99,
        stockQuantity: 10,
      };

      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        filename: 'book-123-456.jpg',
        path: './uploads/book-123-456.jpg',
      } as Express.Multer.File;

      mockBooksService.create.mockResolvedValue({ ...mockBook, imageUrl: '/uploads/book-123-456.jpg' });

      const result = await controller.create(createBookDto, mockFile, mockRequest as any);

      expect(mockBooksService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: createBookDto.title,
          imageUrl: '/uploads/book-123-456.jpg',
        }),
        expect.any(Object)
      );
      expect(result.imageUrl).toBe('/uploads/book-123-456.jpg');
    });

    it('should handle whitespace in title', async () => {
      const createBookDto = {
        title: '   Test Book   ',
        price: 29.99,
        stockQuantity: 10,
      };

      mockBooksService.create.mockResolvedValue(mockBook);

      const result = await controller.create(createBookDto, undefined, mockRequest as any);

      expect(mockBooksService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '   Test Book   ', // Controller doesn't trim automatically
        }),
        expect.any(Object)
      );
    });

    it('should throw BadRequestException if title is missing', async () => {
      const createBookDto = {
        title: '',
        price: 29.99,
        stockQuantity: 10,
      };

      await expect(
        controller.create(createBookDto, undefined, mockRequest as any)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if title is only whitespace', async () => {
      const createBookDto = {
        title: '   ',
        price: 29.99,
        stockQuantity: 10,
      };

      await expect(
        controller.create(createBookDto, undefined, mockRequest as any)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if price is invalid', async () => {
      const createBookDto = {
        title: 'Test Book',
        price: 0,
        stockQuantity: 10,
      };

      await expect(
        controller.create(createBookDto, undefined, mockRequest as any)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if price is NaN', async () => {
      const createBookDto = {
        title: 'Test Book',
        price: 'invalid' as any,
        stockQuantity: 10,
      };

      await expect(
        controller.create(createBookDto, undefined, mockRequest as any)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if stock quantity is negative', async () => {
      const createBookDto = {
        title: 'Test Book',
        price: 29.99,
        stockQuantity: -1,
      };

      await expect(
        controller.create(createBookDto, undefined, mockRequest as any)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if stock quantity is NaN', async () => {
      const createBookDto = {
        title: 'Test Book',
        price: 29.99,
        stockQuantity: 'invalid' as any,
      };

      await expect(
        controller.create(createBookDto, undefined, mockRequest as any)
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle default audit context when minimal request provided', async () => {
      const createBookDto = {
        title: 'Test Book',
        price: 29.99,
        stockQuantity: 10,
      };

      const minimalRequest = {
        headers: {},
      };

      mockBooksService.create.mockResolvedValue(mockBook);

      const result = await controller.create(createBookDto, undefined, minimalRequest as any);

      expect(mockBooksService.create).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          userId: '1', // Default fallback
          ipAddress: 'unknown',
          userAgent: 'unknown',
        })
      );
    });

    it('should handle request without user', async () => {
      const createBookDto = {
        title: 'Test Book',
        price: 29.99,
        stockQuantity: 10,
      };

      const requestWithoutUser = {
        ip: '192.168.1.1',
        headers: { 'user-agent': 'test-browser' },
      };

      mockBooksService.create.mockResolvedValue(mockBook);

      const result = await controller.create(createBookDto, undefined, requestWithoutUser as any);

      expect(mockBooksService.create).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          userId: '1', // Default fallback
          ipAddress: '192.168.1.1',
          userAgent: 'test-browser',
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated books', async () => {
      const mockResult = {
        books: [mockBook],
        total: 1,
      };

      mockBooksService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll();

      expect(mockBooksService.findAll).toHaveBeenCalledWith(1, 10, {}, 'createdAt', 'DESC');
      expect(result).toEqual({
        ...mockResult,
        page: 1,
        limit: 10,
      });
    });

    it('should handle query parameters', async () => {
      const mockResult = {
        books: [mockBook],
        total: 1,
      };

      mockBooksService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(
        '2', // page
        '20', // limit
        'title', // sortBy
        'ASC', // sortOrder
        'Test', // title filter
        'author-id', // authorId filter
        'publisher-id', // publisherId filter
        'genre-id', // genreId filter
        'true' // isAvailable filter
      );

      expect(mockBooksService.findAll).toHaveBeenCalledWith(
        2,
        20,
        {
          title: 'Test',
          authorId: 'author-id',
          publisherId: 'publisher-id',
          genreId: 'genre-id',
          isAvailable: 'true',
        },
        'title',
        'ASC'
      );
      expect(result).toEqual({
        ...mockResult,
        page: 2,
        limit: 20,
      });
    });

    it('should handle invalid page number', async () => {
      const mockResult = {
        books: [mockBook],
        total: 1,
      };

      mockBooksService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll('invalid');

      expect(mockBooksService.findAll).toHaveBeenCalledWith(NaN, 10, {}, 'createdAt', 'DESC');
      expect(result.page).toBe(NaN);
    });

    it('should handle invalid limit', async () => {
      const mockResult = {
        books: [mockBook],
        total: 1,
      };

      mockBooksService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll('1', 'invalid');

      expect(mockBooksService.findAll).toHaveBeenCalledWith(1, NaN, {}, 'createdAt', 'DESC');
      expect(result.limit).toBe(NaN);
    });

    it('should handle zero page number', async () => {
      const mockResult = {
        books: [mockBook],
        total: 1,
      };

      mockBooksService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll('0');

      expect(mockBooksService.findAll).toHaveBeenCalledWith(0, 10, {}, 'createdAt', 'DESC');
      expect(result.page).toBe(0);
    });

    it('should filter out undefined parameters but keep empty strings', async () => {
      const mockResult = {
        books: [mockBook],
        total: 1,
      };

      mockBooksService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(
        '1',
        '10',
        'title',
        'ASC',
        '', // empty title filter
        'author-id',
        '', // empty publisher filter
        undefined, // undefined genre filter
        'false'
      );

      expect(mockBooksService.findAll).toHaveBeenCalledWith(
        1,
        10,
        {
          title: '', // Empty strings are kept
          authorId: 'author-id',
          publisherId: '', // Empty strings are kept
          isAvailable: 'false',
          // genreId is filtered out because it's undefined
        },
        'title',
        'ASC'
      );
    });

    it('should handle minimum and maximum values', async () => {
      const mockResult = {
        books: [mockBook],
        total: 1,
      };

      mockBooksService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(
        '100', // high page number
        '1000', // high limit
        'updatedAt',
        'DESC',
        'Very Long Title That Could Be Used For Testing',
        'very-long-author-id-123456789',
        'very-long-publisher-id-123456789',
        'very-long-genre-id-123456789',
        'true'
      );

      expect(mockBooksService.findAll).toHaveBeenCalledWith(
        100,
        1000,
        {
          title: 'Very Long Title That Could Be Used For Testing',
          authorId: 'very-long-author-id-123456789',
          publisherId: 'very-long-publisher-id-123456789',
          genreId: 'very-long-genre-id-123456789',
          isAvailable: 'true',
        },
        'updatedAt',
        'DESC'
      );
    });
  });

  describe('findOne', () => {
    it('should return a book by id', async () => {
      mockBooksService.findById.mockResolvedValue(mockBook);

      const result = await controller.findOne('123e4567-e89b-12d3-a456-426614174000');

      expect(mockBooksService.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toEqual(mockBook);
    });

    it('should return null if book not found', async () => {
      mockBooksService.findById.mockResolvedValue(null);

      const result = await controller.findOne('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a book', async () => {
      const updateData = {
        title: 'Updated Title',
        price: 39.99,
      };

      mockBooksService.update.mockResolvedValue({ ...mockBook, ...updateData });

      const result = await controller.update(
        '123e4567-e89b-12d3-a456-426614174000',
        updateData,
        undefined, // image file
        mockRequest as any
      );

      expect(mockBooksService.update).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        updateData,
        expect.objectContaining({
          userId: 'user-id',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        })
      );
      expect(result).toEqual({ ...mockBook, ...updateData });
    });

    it('should update a book with image file', async () => {
      const updateData = {
        title: 'Updated Title with Image',
      };

      const mockFile = {
        originalname: 'updated.png',
        mimetype: 'image/png',
        filename: 'book-update-789.png',
        path: './uploads/book-update-789.png',
      } as Express.Multer.File;

      mockBooksService.update.mockResolvedValue({ 
        ...mockBook, 
        ...updateData, 
        imageUrl: '/uploads/book-update-789.png' 
      });

      const result = await controller.update(
        '123e4567-e89b-12d3-a456-426614174000',
        updateData,
        mockFile,
        mockRequest as any
      );

      expect(mockBooksService.update).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        expect.objectContaining({
          ...updateData,
          imageUrl: '/uploads/book-update-789.png',
        }),
        expect.any(Object)
      );
    });

    it('should handle update with minimal request', async () => {
      const updateData = {
        title: 'Updated Title',
      };

      const minimalRequest = {
        headers: {},
      };

      mockBooksService.update.mockResolvedValue({ ...mockBook, ...updateData });

      const result = await controller.update(
        '123e4567-e89b-12d3-a456-426614174000',
        updateData,
        undefined,
        minimalRequest as any
      );

      expect(mockBooksService.update).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        updateData,
        expect.objectContaining({
          userId: '1', // default fallback
          ipAddress: 'unknown',
          userAgent: 'unknown',
        })
      );
    });
  });

  describe('remove', () => {
    it('should delete a book', async () => {
      mockBooksService.findById.mockResolvedValue(mockBook);
      mockBooksService.remove.mockResolvedValue(true);

      const result = await controller.remove('123e4567-e89b-12d3-a456-426614174000', mockRequest as any);

      expect(mockBooksService.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(mockBooksService.remove).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        expect.objectContaining({
          userId: 'user-id',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        })
      );
      expect(result).toEqual({ message: 'Libro eliminado exitosamente' });
    });

    it('should handle book not found', async () => {
      mockBooksService.findById.mockResolvedValue(null);

      await expect(
        controller.remove('non-existent-id', mockRequest as any)
      ).rejects.toThrow('Libro no encontrado');

      expect(mockBooksService.findById).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('exportToCsv', () => {
    it('should export books to CSV', async () => {
      const csvData = 'Title,ISBN,Price\nTest Book,978-0123456789,29.99';
      
      mockBooksService.exportToCsv.mockResolvedValue(csvData);

      const mockResponse = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.exportToCsv(
        undefined, // title
        undefined, // authorId
        undefined, // publisherId
        undefined, // genreId
        undefined, // isAvailable
        mockResponse as any,
        mockRequest as any
      );

      expect(mockBooksService.exportToCsv).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          userId: 'user-id',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        })
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename="libros_')
      );
      expect(mockResponse.write).toHaveBeenCalledWith('\uFEFF'); // BOM
      expect(mockResponse.end).toHaveBeenCalledWith(csvData);
    });

    it('should export books with filters', async () => {
      const csvData = 'Title,ISBN,Price\nFiltered Book,978-1234567890,35.99';
      
      mockBooksService.exportToCsv.mockResolvedValue(csvData);

      const mockResponse = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.exportToCsv(
        'Filtered', // title
        'author-123', // authorId
        'publisher-456', // publisherId
        'genre-789', // genreId
        'true', // isAvailable
        mockResponse as any,
        mockRequest as any
      );

      expect(mockBooksService.exportToCsv).toHaveBeenCalledWith(
        {
          title: 'Filtered',
          authorId: 'author-123',
          publisherId: 'publisher-456',
          genreId: 'genre-789',
          isAvailable: 'true',
        },
        expect.any(Object)
      );
    });

    it('should handle export error', async () => {
      mockBooksService.exportToCsv.mockRejectedValue(new Error('Export failed'));

      const mockResponse = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await expect(
        controller.exportToCsv(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          mockResponse as any,
          mockRequest as any
        )
      ).rejects.toThrow('Error al generar el archivo CSV');
    });

    it('should handle empty filter values', async () => {
      const csvData = 'Title,ISBN,Price\nAll Books,978-0000000000,19.99';
      
      mockBooksService.exportToCsv.mockResolvedValue(csvData);

      const mockResponse = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.exportToCsv(
        '', // empty title
        '', // empty authorId
        '', // empty publisherId
        '', // empty genreId
        '', // empty isAvailable
        mockResponse as any,
        mockRequest as any
      );

      expect(mockBooksService.exportToCsv).toHaveBeenCalledWith(
        {
          title: '',
          authorId: '',
          publisherId: '',
          genreId: '',
          isAvailable: '',
        }, // Empty strings are passed through
        expect.any(Object)
      );
    });

    it('should handle export without proper request and throw error', async () => {
      mockBooksService.exportToCsv.mockResolvedValue('csv data');

      const mockResponse = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await expect(
        controller.exportToCsv(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          mockResponse as any,
          undefined // no request causes error in getAuditContext
        )
      ).rejects.toThrow();
    });
  });

  describe('getAuditContext', () => {
    it('should extract audit context from request', () => {
      const result = (controller as any).getAuditContext(mockRequest);

      expect(result).toEqual({
        userId: 'user-id',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });
    });

    it('should handle request with x-forwarded-for header', () => {
      const requestWithForwardedFor = {
        user: { id: 'user-123' },
        ip: undefined,
        connection: { remoteAddress: undefined },
        headers: { 
          'x-forwarded-for': '192.168.1.100',
          'user-agent': 'chrome-browser' 
        },
      };

      const result = (controller as any).getAuditContext(requestWithForwardedFor);

      expect(result).toEqual({
        userId: 'user-123',
        ipAddress: '192.168.1.100',
        userAgent: 'chrome-browser',
      });
    });

    it('should handle missing connection object', () => {
      const requestWithoutConnection = {
        user: { id: 'user-456' },
        ip: undefined,
        connection: undefined,
        headers: { 'user-agent': 'safari-browser' },
      };

      const result = (controller as any).getAuditContext(requestWithoutConnection);

      expect(result).toEqual({
        userId: 'user-456',
        ipAddress: 'unknown',
        userAgent: 'safari-browser',
      });
    });

    it('should handle request with minimal properties', () => {
      const minimalRequest = {
        headers: {},
      };

      const result = (controller as any).getAuditContext(minimalRequest);

      expect(result).toEqual({
        userId: '1',
        ipAddress: 'unknown',
        userAgent: 'unknown',
      });
    });
  });

  describe('service error handling', () => {
    it('should propagate service errors in create', async () => {
      const createBookDto = {
        title: 'Test Book',
        price: 29.99,
        stockQuantity: 10,
      };

      mockBooksService.create.mockRejectedValue(new Error('Database error'));

      await expect(
        controller.create(createBookDto, undefined, mockRequest as any)
      ).rejects.toThrow('Database error');
    });

    it('should propagate service errors in update', async () => {
      const updateData = { title: 'Updated Title' };

      mockBooksService.update.mockRejectedValue(new Error('Update failed'));

      await expect(
        controller.update('book-id', updateData, undefined, mockRequest as any)
      ).rejects.toThrow('Update failed');
    });

    it('should propagate service errors in findAll', async () => {
      mockBooksService.findAll.mockRejectedValue(new Error('Query failed'));

      await expect(
        controller.findAll()
      ).rejects.toThrow('Query failed');
    });

    it('should propagate service errors in findOne', async () => {
      mockBooksService.findById.mockRejectedValue(new Error('Not found'));

      await expect(
        controller.findOne('book-id')
      ).rejects.toThrow('Not found');
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle very long titles', async () => {
      const longTitle = 'A'.repeat(1000);
      const createBookDto = {
        title: longTitle,
        price: 29.99,
        stockQuantity: 10,
      };

      mockBooksService.create.mockResolvedValue({ ...mockBook, title: longTitle });

      const result = await controller.create(createBookDto, undefined, mockRequest as any);

      expect(mockBooksService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: longTitle,
        }),
        expect.any(Object)
      );
    });

    it('should handle maximum price values', async () => {
      const createBookDto = {
        title: 'Expensive Book',
        price: 999999.99,
        stockQuantity: 1,
      };

      mockBooksService.create.mockResolvedValue(mockBook);

      const result = await controller.create(createBookDto, undefined, mockRequest as any);

      expect(mockBooksService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          price: 999999.99,
        }),
        expect.any(Object)
      );
    });

    it('should handle maximum stock quantity', async () => {
      const createBookDto = {
        title: 'High Stock Book',
        price: 19.99,
        stockQuantity: 999999,
      };

      mockBooksService.create.mockResolvedValue(mockBook);

      const result = await controller.create(createBookDto, undefined, mockRequest as any);

      expect(mockBooksService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          stockQuantity: 999999,
        }),
        expect.any(Object)
      );
    });

    it('should handle special characters in title', async () => {
      const specialTitle = 'Título con ñ, á, é, í, ó, ú & símbolos!@#$%^&*()';
      const createBookDto = {
        title: specialTitle,
        price: 29.99,
        stockQuantity: 10,
      };

      mockBooksService.create.mockResolvedValue({ ...mockBook, title: specialTitle });

      const result = await controller.create(createBookDto, undefined, mockRequest as any);

      expect(mockBooksService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: specialTitle,
        }),
        expect.any(Object)
      );
    });
  });
});