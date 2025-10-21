import { Test, TestingModule } from '@nestjs/testing';
import { GenresController } from './genres.controller';
import { GenresService } from './genres.service';

describe('GenresController', () => {
  let controller: GenresController;
  let genresService: any;

  const mockGenre = {
    id: 'genre-id',
    name: 'Test Genre',
    description: 'Test genre description',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockGenresService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenresController],
      providers: [
        {
          provide: GenresService,
          useValue: mockGenresService,
        },
      ],
    }).compile();

    controller = module.get<GenresController>(GenresController);
    genresService = module.get<GenresService>(GenresService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all genres', async () => {
      const expectedGenres = [mockGenre];

      mockGenresService.findAll.mockResolvedValue(expectedGenres);

      const result = await controller.findAll();

      expect(mockGenresService.findAll).toHaveBeenCalledWith();
      expect(result).toEqual(expectedGenres);
    });

    it('should return empty array when no genres exist', async () => {
      mockGenresService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(mockGenresService.findAll).toHaveBeenCalledWith();
      expect(result).toEqual([]);
    });

    it('should handle service error', async () => {
      mockGenresService.findAll.mockRejectedValue(new Error('Database error'));

      await expect(controller.findAll()).rejects.toThrow('Database error');

      expect(mockGenresService.findAll).toHaveBeenCalledWith();
    });

    it('should return multiple genres', async () => {
      const genres = [
        mockGenre,
        {
          id: 'genre-id-2',
          name: 'Fiction',
          description: 'Fiction genre description',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'genre-id-3',
          name: 'Non-Fiction',
          description: 'Non-fiction genre description',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockGenresService.findAll.mockResolvedValue(genres);

      const result = await controller.findAll();

      expect(mockGenresService.findAll).toHaveBeenCalledWith();
      expect(result).toEqual(genres);
      expect(result).toHaveLength(3);
    });

    it('should handle null response from service', async () => {
      mockGenresService.findAll.mockResolvedValue(null);

      const result = await controller.findAll();

      expect(mockGenresService.findAll).toHaveBeenCalledWith();
      expect(result).toBeNull();
    });

    it('should handle genres with special characters', async () => {
      const specialGenre = {
        id: 'special-genre-id',
        name: 'Sci-Fi & Fantasy',
        description: 'Science Fiction & Fantasy genre with special chars: ñáéíóú',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGenresService.findAll.mockResolvedValue([specialGenre]);

      const result = await controller.findAll();

      expect(mockGenresService.findAll).toHaveBeenCalledWith();
      expect(result).toEqual([specialGenre]);
      expect(result[0].name).toBe('Sci-Fi & Fantasy');
    });

    it('should handle genres without descriptions', async () => {
      const genreWithoutDescription = {
        id: 'no-desc-genre-id',
        name: 'Mystery',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGenresService.findAll.mockResolvedValue([genreWithoutDescription]);

      const result = await controller.findAll();

      expect(mockGenresService.findAll).toHaveBeenCalledWith();
      expect(result).toEqual([genreWithoutDescription]);
      expect(result[0].description).toBeUndefined();
    });
  });
});