import { Test, TestingModule } from '@nestjs/testing';
import { AuthorsService } from './authors.service';
import { getModelToken } from '@nestjs/sequelize';
import { Author } from './entities/author.entity';

describe('AuthorsService', () => {
  let service: AuthorsService;
  let authorModel: any;

  const mockAuthor = {
    id: 'author-id',
    name: 'Test Author',
    biography: 'Test biography',
    birthDate: new Date('1980-01-01'),
    nationality: 'Chilean',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
    update: jest.fn().mockResolvedValue(this),
    destroy: jest.fn().mockResolvedValue(this),
    toJSON: jest.fn().mockReturnValue({
      id: 'author-id',
      name: 'Test Author',
      biography: 'Test biography',
      birthDate: new Date('1980-01-01'),
      nationality: 'Chilean',
      isActive: true,
    }),
  };

  const mockAuthorModel = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorsService,
        {
          provide: getModelToken(Author),
          useValue: mockAuthorModel,
        },
      ],
    }).compile();

    service = module.get<AuthorsService>(AuthorsService);
    authorModel = module.get(getModelToken(Author));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createAuthorData = {
      name: 'New Author',
      biography: 'Author biography',
      birthDate: new Date('1985-05-15'),
      nationality: 'Chilean',
    };

    it('should create a new author successfully', async () => {
      mockAuthorModel.create.mockResolvedValue(mockAuthor);

      const result = await service.create(createAuthorData);

      expect(mockAuthorModel.create).toHaveBeenCalledWith(createAuthorData);
      expect(result).toEqual(mockAuthor);
    });
  });

  describe('findAll', () => {
    it('should return all authors', async () => {
      mockAuthorModel.findAll.mockResolvedValue([mockAuthor]);

      const result = await service.findAll();

      expect(mockAuthorModel.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockAuthor]);
    });
  });

  describe('findById', () => {
    it('should return author by id', async () => {
      mockAuthorModel.findByPk.mockResolvedValue(mockAuthor);

      const result = await service.findById('author-id');

      expect(mockAuthorModel.findByPk).toHaveBeenCalledWith('author-id');
      expect(result).toEqual(mockAuthor);
    });

    it('should return null when author not found', async () => {
      mockAuthorModel.findByPk.mockResolvedValue(null);

      const result = await service.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateAuthorData = {
      name: 'Updated Author',
      biography: 'Updated biography',
      nationality: 'Argentinian',
    };

    it('should update author successfully and return updated author', async () => {
      const updatedAuthor = { ...mockAuthor, ...updateAuthorData };
      
      mockAuthorModel.update.mockResolvedValue([1]); // 1 row updated
      mockAuthorModel.findByPk.mockResolvedValue(updatedAuthor);

      const result = await service.update('author-id', updateAuthorData);

      expect(mockAuthorModel.update).toHaveBeenCalledWith(updateAuthorData, {
        where: { id: 'author-id' },
      });
      expect(mockAuthorModel.findByPk).toHaveBeenCalledWith('author-id');
      expect(result).toEqual(updatedAuthor);
    });

    it('should return null when no rows are updated', async () => {
      mockAuthorModel.update.mockResolvedValue([0]); // 0 rows updated

      const result = await service.update('nonexistent-id', updateAuthorData);

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should delete author successfully and return true', async () => {
      mockAuthorModel.destroy.mockResolvedValue(1); // 1 row deleted

      const result = await service.remove('author-id');

      expect(mockAuthorModel.destroy).toHaveBeenCalledWith({
        where: { id: 'author-id' },
      });
      expect(result).toBe(true);
    });

    it('should return false when no rows are deleted', async () => {
      mockAuthorModel.destroy.mockResolvedValue(0); // 0 rows deleted

      const result = await service.remove('nonexistent-id');

      expect(result).toBe(false);
    });
  });


});