import { Test, TestingModule } from '@nestjs/testing';
import { PublishersService } from './publishers.service';
import { getModelToken } from '@nestjs/sequelize';
import { Publisher } from './entities/publisher.entity';

describe('PublishersService', () => {
  let service: PublishersService;
  let publisherModel: any;

  const mockPublisher = {
    id: 'publisher-id',
    name: 'Test Publisher',
    country: 'Chile',
    foundedYear: 1990,
    address: 'Test Address',
    website: 'https://testpublisher.com',
    email: 'contact@testpublisher.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON: jest.fn().mockReturnValue({
      id: 'publisher-id',
      name: 'Test Publisher',
      country: 'Chile',
      foundedYear: 1990,
      address: 'Test Address',
      website: 'https://testpublisher.com',
      email: 'contact@testpublisher.com',
    }),
  };

  const mockPublisherModel = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishersService,
        {
          provide: getModelToken(Publisher),
          useValue: mockPublisherModel,
        },
      ],
    }).compile();

    service = module.get<PublishersService>(PublishersService);
    publisherModel = module.get(getModelToken(Publisher));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createPublisherData = {
      name: 'New Publisher',
      country: 'Argentina',
      foundedYear: 2000,
    };

    it('should create a new publisher successfully', async () => {
      mockPublisherModel.create.mockResolvedValue(mockPublisher);

      const result = await service.create(createPublisherData);

      expect(mockPublisherModel.create).toHaveBeenCalledWith(createPublisherData);
      expect(result).toEqual(mockPublisher);
    });

    it('should create publisher with minimal data', async () => {
      const minimalData = {
        name: 'Minimal Publisher',
      };

      mockPublisherModel.create.mockResolvedValue(mockPublisher);

      const result = await service.create(minimalData);

      expect(mockPublisherModel.create).toHaveBeenCalledWith(minimalData);
      expect(result).toEqual(mockPublisher);
    });

    it('should handle database errors during creation', async () => {
      const error = new Error('Database error');
      mockPublisherModel.create.mockRejectedValue(error);

      await expect(service.create(createPublisherData)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return all publishers', async () => {
      const publishers = [mockPublisher];
      mockPublisherModel.findAll.mockResolvedValue(publishers);

      const result = await service.findAll();

      expect(mockPublisherModel.findAll).toHaveBeenCalled();
      expect(result).toEqual(publishers);
    });

    it('should return empty array when no publishers exist', async () => {
      mockPublisherModel.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should handle database errors during findAll', async () => {
      const error = new Error('Database connection error');
      mockPublisherModel.findAll.mockRejectedValue(error);

      await expect(service.findAll()).rejects.toThrow('Database connection error');
    });
  });

  describe('findById', () => {
    it('should return publisher by id', async () => {
      mockPublisherModel.findByPk.mockResolvedValue(mockPublisher);

      const result = await service.findById('publisher-id');

      expect(mockPublisherModel.findByPk).toHaveBeenCalledWith('publisher-id');
      expect(result).toEqual(mockPublisher);
    });

    it('should return null when publisher not found', async () => {
      mockPublisherModel.findByPk.mockResolvedValue(null);

      const result = await service.findById('nonexistent-id');

      expect(mockPublisherModel.findByPk).toHaveBeenCalledWith('nonexistent-id');
      expect(result).toBeNull();
    });

    it('should handle database errors during findById', async () => {
      const error = new Error('Database error');
      mockPublisherModel.findByPk.mockRejectedValue(error);

      await expect(service.findById('publisher-id')).rejects.toThrow('Database error');
    });
  });

  describe('update', () => {
    const updatePublisherData = {
      name: 'Updated Publisher',
      country: 'Mexico',
      foundedYear: 1995,
    };

    it('should update publisher successfully and return updated publisher', async () => {
      const updatedPublisher = { ...mockPublisher, ...updatePublisherData };
      
      mockPublisherModel.update.mockResolvedValue([1]); // 1 row updated
      mockPublisherModel.findByPk.mockResolvedValue(updatedPublisher);

      const result = await service.update('publisher-id', updatePublisherData);

      expect(mockPublisherModel.update).toHaveBeenCalledWith(updatePublisherData, {
        where: { id: 'publisher-id' },
      });
      expect(mockPublisherModel.findByPk).toHaveBeenCalledWith('publisher-id');
      expect(result).toEqual(updatedPublisher);
    });

    it('should return null when no rows are updated', async () => {
      mockPublisherModel.update.mockResolvedValue([0]); // 0 rows updated

      const result = await service.update('nonexistent-id', updatePublisherData);

      expect(mockPublisherModel.update).toHaveBeenCalledWith(updatePublisherData, {
        where: { id: 'nonexistent-id' },
      });
      expect(result).toBeNull();
    });

    it('should handle partial updates', async () => {
      const partialUpdate = {
        name: 'Partially Updated Publisher',
      };
      const updatedPublisher = { ...mockPublisher, ...partialUpdate };

      mockPublisherModel.update.mockResolvedValue([1]);
      mockPublisherModel.findByPk.mockResolvedValue(updatedPublisher);

      const result = await service.update('publisher-id', partialUpdate);

      expect(mockPublisherModel.update).toHaveBeenCalledWith(partialUpdate, {
        where: { id: 'publisher-id' },
      });
      expect(result).toEqual(updatedPublisher);
    });

    it('should handle database errors during update', async () => {
      const error = new Error('Database error');
      mockPublisherModel.update.mockRejectedValue(error);

      await expect(service.update('publisher-id', updatePublisherData)).rejects.toThrow('Database error');
    });
  });

  describe('remove', () => {
    it('should delete publisher successfully and return true', async () => {
      mockPublisherModel.destroy.mockResolvedValue(1); // 1 row deleted

      const result = await service.remove('publisher-id');

      expect(mockPublisherModel.destroy).toHaveBeenCalledWith({
        where: { id: 'publisher-id' },
      });
      expect(result).toBe(true);
    });

    it('should return false when no rows are deleted', async () => {
      mockPublisherModel.destroy.mockResolvedValue(0); // 0 rows deleted

      const result = await service.remove('nonexistent-id');

      expect(mockPublisherModel.destroy).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' },
      });
      expect(result).toBe(false);
    });

    it('should handle database errors during removal', async () => {
      const error = new Error('Database error');
      mockPublisherModel.destroy.mockRejectedValue(error);

      await expect(service.remove('publisher-id')).rejects.toThrow('Database error');
    });
  });

  describe('error handling', () => {
    it('should propagate database connection errors', async () => {
      const connectionError = new Error('Connection refused');
      mockPublisherModel.findAll.mockRejectedValue(connectionError);

      await expect(service.findAll()).rejects.toThrow('Connection refused');
    });

    it('should handle constraint violation errors', async () => {
      const constraintError = new Error('Unique constraint violation');
      mockPublisherModel.create.mockRejectedValue(constraintError);

      const publisherData = {
        name: 'Duplicate Publisher',
      };

      await expect(service.create(publisherData)).rejects.toThrow('Unique constraint violation');
    });
  });

  describe('data validation', () => {
    it('should handle empty string values', async () => {
      const publisherDataWithEmptyStrings = {
        name: 'Valid Publisher',
        country: '',
        foundedYear: null,
      };

      mockPublisherModel.create.mockResolvedValue(mockPublisher);

      const result = await service.create(publisherDataWithEmptyStrings);

      expect(mockPublisherModel.create).toHaveBeenCalledWith(publisherDataWithEmptyStrings);
      expect(result).toEqual(mockPublisher);
    });

    it('should handle undefined optional fields', async () => {
      const publisherDataWithUndefined = {
        name: 'Valid Publisher',
        country: undefined,
        foundedYear: undefined,
      };

      mockPublisherModel.create.mockResolvedValue(mockPublisher);

      const result = await service.create(publisherDataWithUndefined);

      expect(mockPublisherModel.create).toHaveBeenCalledWith(publisherDataWithUndefined);
      expect(result).toEqual(mockPublisher);
    });
  });

  describe('edge cases', () => {
    it('should handle very long publisher names', async () => {
      const longName = 'A'.repeat(500);
      const publisherWithLongName = {
        name: longName,
      };

      mockPublisherModel.create.mockResolvedValue(mockPublisher);

      const result = await service.create(publisherWithLongName);

      expect(mockPublisherModel.create).toHaveBeenCalledWith(publisherWithLongName);
      expect(result).toEqual(mockPublisher);
    });

    it('should handle extreme founded year values', async () => {
      const publisherWithExtremeYear = {
        name: 'Ancient Publisher',
        foundedYear: 1,
      };

      mockPublisherModel.create.mockResolvedValue(mockPublisher);

      const result = await service.create(publisherWithExtremeYear);

      expect(mockPublisherModel.create).toHaveBeenCalledWith(publisherWithExtremeYear);
      expect(result).toEqual(mockPublisher);
    });

    it('should handle special characters in publisher name', async () => {
      const publisherWithSpecialChars = {
        name: 'Publisher & Co. (©2023) - "Special" Characters!',
      };

      mockPublisherModel.create.mockResolvedValue(mockPublisher);

      const result = await service.create(publisherWithSpecialChars);

      expect(mockPublisherModel.create).toHaveBeenCalledWith(publisherWithSpecialChars);
      expect(result).toEqual(mockPublisher);
    });
  });
});