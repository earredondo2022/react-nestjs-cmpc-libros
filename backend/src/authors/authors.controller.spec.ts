import { Test, TestingModule } from '@nestjs/testing';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';

describe('AuthorsController', () => {
  let controller: AuthorsController;
  let authorsService: any;

  const mockAuthor = {
    id: 'author-id',
    name: 'Test Author',
    biography: 'Test biography',
    birthDate: new Date('1980-01-01'),
    nationality: 'Test Country',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthorsService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthorsController],
      providers: [
        {
          provide: AuthorsService,
          useValue: mockAuthorsService,
        },
      ],
    }).compile();

    controller = module.get<AuthorsController>(AuthorsController);
    authorsService = module.get<AuthorsService>(AuthorsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all authors', async () => {
      const expectedAuthors = [mockAuthor];

      mockAuthorsService.findAll.mockResolvedValue(expectedAuthors);

      const result = await controller.findAll();

      expect(mockAuthorsService.findAll).toHaveBeenCalledWith();
      expect(result).toEqual(expectedAuthors);
    });

    it('should return empty array when no authors exist', async () => {
      mockAuthorsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(mockAuthorsService.findAll).toHaveBeenCalledWith();
      expect(result).toEqual([]);
    });

    it('should handle service error', async () => {
      mockAuthorsService.findAll.mockRejectedValue(new Error('Database error'));

      await expect(controller.findAll()).rejects.toThrow('Database error');

      expect(mockAuthorsService.findAll).toHaveBeenCalledWith();
    });

    it('should return multiple authors', async () => {
      const secondAuthor = {
        id: 'author-id-2',
        name: 'Second Author',
        biography: 'Second biography',
        birthDate: new Date('1975-03-15'),
        nationality: 'Another Country',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedAuthors = [mockAuthor, secondAuthor];

      mockAuthorsService.findAll.mockResolvedValue(expectedAuthors);

      const result = await controller.findAll();

      expect(mockAuthorsService.findAll).toHaveBeenCalledWith();
      expect(result).toEqual(expectedAuthors);
      expect(result).toHaveLength(2);
    });

    it('should handle null response from service', async () => {
      mockAuthorsService.findAll.mockResolvedValue(null);

      const result = await controller.findAll();

      expect(mockAuthorsService.findAll).toHaveBeenCalledWith();
      expect(result).toBeNull();
    });
  });
});