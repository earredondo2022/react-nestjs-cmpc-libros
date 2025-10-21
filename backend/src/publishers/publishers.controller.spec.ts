import { Test, TestingModule } from '@nestjs/testing';
import { PublishersController } from './publishers.controller';
import { PublishersService } from './publishers.service';

describe('PublishersController', () => {
  let controller: PublishersController;
  let publishersService: any;

  const mockPublisher = {
    id: 'publisher-id',
    name: 'Test Publisher',
    address: 'Test Address',
    phone: '+1234567890',
    email: 'test@publisher.com',
    website: 'https://testpublisher.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPublishersService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublishersController],
      providers: [
        {
          provide: PublishersService,
          useValue: mockPublishersService,
        },
      ],
    }).compile();

    controller = module.get<PublishersController>(PublishersController);
    publishersService = module.get<PublishersService>(PublishersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all publishers', async () => {
      const expectedPublishers = [mockPublisher];

      mockPublishersService.findAll.mockResolvedValue(expectedPublishers);

      const result = await controller.findAll();

      expect(mockPublishersService.findAll).toHaveBeenCalledWith();
      expect(result).toEqual(expectedPublishers);
    });

    it('should return empty array when no publishers exist', async () => {
      mockPublishersService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(mockPublishersService.findAll).toHaveBeenCalledWith();
      expect(result).toEqual([]);
    });

    it('should handle service error', async () => {
      mockPublishersService.findAll.mockRejectedValue(new Error('Database error'));

      await expect(controller.findAll()).rejects.toThrow('Database error');

      expect(mockPublishersService.findAll).toHaveBeenCalledWith();
    });

    it('should return multiple publishers', async () => {
      const secondPublisher = {
        id: 'publisher-id-2',
        name: 'Second Publisher',
        address: 'Second Address',
        phone: '+0987654321',
        email: 'second@publisher.com',
        website: 'https://secondpublisher.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedPublishers = [mockPublisher, secondPublisher];

      mockPublishersService.findAll.mockResolvedValue(expectedPublishers);

      const result = await controller.findAll();

      expect(mockPublishersService.findAll).toHaveBeenCalledWith();
      expect(result).toEqual(expectedPublishers);
      expect(result).toHaveLength(2);
    });

    it('should handle null response from service', async () => {
      mockPublishersService.findAll.mockResolvedValue(null);

      const result = await controller.findAll();

      expect(mockPublishersService.findAll).toHaveBeenCalledWith();
      expect(result).toBeNull();
    });

    it('should handle publishers with minimal data', async () => {
      const minimalPublisher = {
        id: 'minimal-publisher-id',
        name: 'Minimal Publisher',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPublishersService.findAll.mockResolvedValue([minimalPublisher]);

      const result = await controller.findAll();

      expect(mockPublishersService.findAll).toHaveBeenCalledWith();
      expect(result).toEqual([minimalPublisher]);
      expect(result[0].name).toBe('Minimal Publisher');
    });
  });
});