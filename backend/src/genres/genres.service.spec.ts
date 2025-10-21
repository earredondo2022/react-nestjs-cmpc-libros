import { Test, TestingModule } from '@nestjs/testing';
import { GenresService } from './genres.service';
import { getModelToken } from '@nestjs/sequelize';
import { Genre } from './entities/genre.entity';

describe('GenresService', () => {
  let service: GenresService;
  let genreModel: any;

  const mockGenre = {
    id: 'genre-id',
    name: 'Test Genre',
    description: 'Test genre description',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON: jest.fn().mockReturnValue({
      id: 'genre-id',
      name: 'Test Genre',
      description: 'Test genre description',
      isActive: true,
    }),
  };

  const mockGenreModel = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenresService,
        {
          provide: getModelToken(Genre),
          useValue: mockGenreModel,
        },
      ],
    }).compile();

    service = module.get<GenresService>(GenresService);
    genreModel = module.get(getModelToken(Genre));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createGenreData = {
      name: 'New Genre',
      description: 'New genre description',
    };

    it('should create a new genre successfully', async () => {
      mockGenreModel.create.mockResolvedValue(mockGenre);

      const result = await service.create(createGenreData);

      expect(mockGenreModel.create).toHaveBeenCalledWith(createGenreData);
      expect(result).toEqual(mockGenre);
    });

    it('should create genre with minimal data (only name)', async () => {
      const minimalData = {
        name: 'Minimal Genre',
      };

      mockGenreModel.create.mockResolvedValue(mockGenre);

      const result = await service.create(minimalData);

      expect(mockGenreModel.create).toHaveBeenCalledWith(minimalData);
      expect(result).toEqual(mockGenre);
    });

    it('should handle database errors during creation', async () => {
      const error = new Error('Database error');
      mockGenreModel.create.mockRejectedValue(error);

      await expect(service.create(createGenreData)).rejects.toThrow('Database error');
    });

    it('should create genre with undefined description', async () => {
      const genreWithUndefinedDescription = {
        name: 'Genre Without Description',
        description: undefined,
      };

      mockGenreModel.create.mockResolvedValue(mockGenre);

      const result = await service.create(genreWithUndefinedDescription);

      expect(mockGenreModel.create).toHaveBeenCalledWith(genreWithUndefinedDescription);
      expect(result).toEqual(mockGenre);
    });
  });

  describe('findAll', () => {
    it('should return all genres', async () => {
      const genres = [mockGenre];
      mockGenreModel.findAll.mockResolvedValue(genres);

      const result = await service.findAll();

      expect(mockGenreModel.findAll).toHaveBeenCalled();
      expect(result).toEqual(genres);
    });

    it('should return empty array when no genres exist', async () => {
      mockGenreModel.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should return multiple genres', async () => {
      const multipleGenres = [
        { ...mockGenre, id: 'genre-1', name: 'Fiction' },
        { ...mockGenre, id: 'genre-2', name: 'Non-Fiction' },
        { ...mockGenre, id: 'genre-3', name: 'Science Fiction' },
      ];

      mockGenreModel.findAll.mockResolvedValue(multipleGenres);

      const result = await service.findAll();

      expect(result).toEqual(multipleGenres);
      expect(result).toHaveLength(3);
    });

    it('should handle database errors during findAll', async () => {
      const error = new Error('Database connection error');
      mockGenreModel.findAll.mockRejectedValue(error);

      await expect(service.findAll()).rejects.toThrow('Database connection error');
    });
  });

  describe('findById', () => {
    it('should return genre by id', async () => {
      mockGenreModel.findByPk.mockResolvedValue(mockGenre);

      const result = await service.findById('genre-id');

      expect(mockGenreModel.findByPk).toHaveBeenCalledWith('genre-id');
      expect(result).toEqual(mockGenre);
    });

    it('should return null when genre not found', async () => {
      mockGenreModel.findByPk.mockResolvedValue(null);

      const result = await service.findById('nonexistent-id');

      expect(mockGenreModel.findByPk).toHaveBeenCalledWith('nonexistent-id');
      expect(result).toBeNull();
    });

    it('should handle database errors during findById', async () => {
      const error = new Error('Database error');
      mockGenreModel.findByPk.mockRejectedValue(error);

      await expect(service.findById('genre-id')).rejects.toThrow('Database error');
    });

    it('should handle invalid UUID format', async () => {
      const invalidId = 'invalid-uuid';
      const error = new Error('Invalid UUID format');
      mockGenreModel.findByPk.mockRejectedValue(error);

      await expect(service.findById(invalidId)).rejects.toThrow('Invalid UUID format');
    });
  });

  describe('update', () => {
    const updateGenreData = {
      name: 'Updated Genre',
      description: 'Updated genre description',
    };

    it('should update genre successfully and return updated genre', async () => {
      const updatedGenre = { ...mockGenre, ...updateGenreData };
      
      mockGenreModel.update.mockResolvedValue([1]); // 1 row updated
      mockGenreModel.findByPk.mockResolvedValue(updatedGenre);

      const result = await service.update('genre-id', updateGenreData);

      expect(mockGenreModel.update).toHaveBeenCalledWith(updateGenreData, {
        where: { id: 'genre-id' },
      });
      expect(mockGenreModel.findByPk).toHaveBeenCalledWith('genre-id');
      expect(result).toEqual(updatedGenre);
    });

    it('should return null when no rows are updated', async () => {
      mockGenreModel.update.mockResolvedValue([0]); // 0 rows updated

      const result = await service.update('nonexistent-id', updateGenreData);

      expect(mockGenreModel.update).toHaveBeenCalledWith(updateGenreData, {
        where: { id: 'nonexistent-id' },
      });
      expect(result).toBeNull();
    });

    it('should handle partial updates', async () => {
      const partialUpdate = {
        name: 'Partially Updated Genre',
      };
      const updatedGenre = { ...mockGenre, ...partialUpdate };

      mockGenreModel.update.mockResolvedValue([1]);
      mockGenreModel.findByPk.mockResolvedValue(updatedGenre);

      const result = await service.update('genre-id', partialUpdate);

      expect(mockGenreModel.update).toHaveBeenCalledWith(partialUpdate, {
        where: { id: 'genre-id' },
      });
      expect(result).toEqual(updatedGenre);
    });

    it('should update only description', async () => {
      const descriptionOnlyUpdate = {
        description: 'Only description updated',
      };
      const updatedGenre = { ...mockGenre, ...descriptionOnlyUpdate };

      mockGenreModel.update.mockResolvedValue([1]);
      mockGenreModel.findByPk.mockResolvedValue(updatedGenre);

      const result = await service.update('genre-id', descriptionOnlyUpdate);

      expect(mockGenreModel.update).toHaveBeenCalledWith(descriptionOnlyUpdate, {
        where: { id: 'genre-id' },
      });
      expect(result).toEqual(updatedGenre);
    });

    it('should handle database errors during update', async () => {
      const error = new Error('Database error');
      mockGenreModel.update.mockRejectedValue(error);

      await expect(service.update('genre-id', updateGenreData)).rejects.toThrow('Database error');
    });

    it('should handle empty update data', async () => {
      const emptyUpdate = {};
      
      mockGenreModel.update.mockResolvedValue([1]);
      mockGenreModel.findByPk.mockResolvedValue(mockGenre);

      const result = await service.update('genre-id', emptyUpdate);

      expect(mockGenreModel.update).toHaveBeenCalledWith(emptyUpdate, {
        where: { id: 'genre-id' },
      });
      expect(result).toEqual(mockGenre);
    });
  });

  describe('remove', () => {
    it('should delete genre successfully and return true', async () => {
      mockGenreModel.destroy.mockResolvedValue(1); // 1 row deleted

      const result = await service.remove('genre-id');

      expect(mockGenreModel.destroy).toHaveBeenCalledWith({
        where: { id: 'genre-id' },
      });
      expect(result).toBe(true);
    });

    it('should return false when no rows are deleted', async () => {
      mockGenreModel.destroy.mockResolvedValue(0); // 0 rows deleted

      const result = await service.remove('nonexistent-id');

      expect(mockGenreModel.destroy).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' },
      });
      expect(result).toBe(false);
    });

    it('should handle database errors during removal', async () => {
      const error = new Error('Database error');
      mockGenreModel.destroy.mockRejectedValue(error);

      await expect(service.remove('genre-id')).rejects.toThrow('Database error');
    });

    it('should handle foreign key constraint errors', async () => {
      const constraintError = new Error('Foreign key constraint violation');
      mockGenreModel.destroy.mockRejectedValue(constraintError);

      await expect(service.remove('genre-id')).rejects.toThrow('Foreign key constraint violation');
    });
  });

  describe('error handling', () => {
    it('should propagate database connection errors', async () => {
      const connectionError = new Error('Connection refused');
      mockGenreModel.findAll.mockRejectedValue(connectionError);

      await expect(service.findAll()).rejects.toThrow('Connection refused');
    });

    it('should handle constraint violation errors on create', async () => {
      const constraintError = new Error('Unique constraint violation');
      mockGenreModel.create.mockRejectedValue(constraintError);

      const genreData = {
        name: 'Duplicate Genre',
      };

      await expect(service.create(genreData)).rejects.toThrow('Unique constraint violation');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Query timeout');
      mockGenreModel.findByPk.mockRejectedValue(timeoutError);

      await expect(service.findById('genre-id')).rejects.toThrow('Query timeout');
    });
  });

  describe('data validation edge cases', () => {
    it('should handle empty string name', async () => {
      const genreWithEmptyName = {
        name: '',
        description: 'Valid description',
      };

      mockGenreModel.create.mockResolvedValue(mockGenre);

      const result = await service.create(genreWithEmptyName);

      expect(mockGenreModel.create).toHaveBeenCalledWith(genreWithEmptyName);
      expect(result).toEqual(mockGenre);
    });

    it('should handle very long genre names', async () => {
      const longName = 'A'.repeat(1000);
      const genreWithLongName = {
        name: longName,
        description: 'Valid description',
      };

      mockGenreModel.create.mockResolvedValue(mockGenre);

      const result = await service.create(genreWithLongName);

      expect(mockGenreModel.create).toHaveBeenCalledWith(genreWithLongName);
      expect(result).toEqual(mockGenre);
    });

    it('should handle special characters in genre name', async () => {
      const genreWithSpecialChars = {
        name: 'Science Fiction & Fantasy - "Speculative" Fiction!',
        description: 'Genre with special characters',
      };

      mockGenreModel.create.mockResolvedValue(mockGenre);

      const result = await service.create(genreWithSpecialChars);

      expect(mockGenreModel.create).toHaveBeenCalledWith(genreWithSpecialChars);
      expect(result).toEqual(mockGenre);
    });

    it('should handle unicode characters in genre data', async () => {
      const genreWithUnicode = {
        name: 'Género Español 📚',
        description: 'Descripción con acentos y emojis 🇪🇸',
      };

      mockGenreModel.create.mockResolvedValue(mockGenre);

      const result = await service.create(genreWithUnicode);

      expect(mockGenreModel.create).toHaveBeenCalledWith(genreWithUnicode);
      expect(result).toEqual(mockGenre);
    });

    it('should handle null description', async () => {
      const genreWithNullDescription = {
        name: 'Genre with null description',
        description: null,
      };

      mockGenreModel.create.mockResolvedValue(mockGenre);

      const result = await service.create(genreWithNullDescription);

      expect(mockGenreModel.create).toHaveBeenCalledWith(genreWithNullDescription);
      expect(result).toEqual(mockGenre);
    });
  });

  describe('performance considerations', () => {
    it('should handle large result sets efficiently', async () => {
      const largeGenreList = Array.from({ length: 1000 }, (_, index) => ({
        ...mockGenre,
        id: `genre-${index}`,
        name: `Genre ${index}`,
      }));

      mockGenreModel.findAll.mockResolvedValue(largeGenreList);

      const result = await service.findAll();

      expect(result).toHaveLength(1000);
      expect(mockGenreModel.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent operations', async () => {
      mockGenreModel.findByPk.mockResolvedValue(mockGenre);

      // Simulate concurrent findById calls
      const promises = Array.from({ length: 10 }, (_, index) => 
        service.findById(`genre-${index}`)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(mockGenreModel.findByPk).toHaveBeenCalledTimes(10);
      results.forEach(result => {
        expect(result).toEqual(mockGenre);
      });
    });
  });
});