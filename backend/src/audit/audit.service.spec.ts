import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { getModelToken } from '@nestjs/sequelize';
import { AuditLog } from './entities/audit-log.entity';
import { Op } from 'sequelize';

describe('AuditService', () => {
  let service: AuditService;
  let auditLogModel: any;

  const mockAuditLog = {
    id: 'audit-log-id',
    userId: 'user-id',
    action: 'CREATE',
    tableName: 'books',
    recordId: 'book-id',
    oldValues: null,
    newValues: { title: 'Test Book', author: 'Test Author' },
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    description: 'Created new book',
    createdAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
    toJSON: jest.fn().mockReturnValue({
      id: 'audit-log-id',
      userId: 'user-id',
      action: 'CREATE',
      tableName: 'books',
      recordId: 'book-id',
      oldValues: null,
      newValues: { title: 'Test Book', author: 'Test Author' },
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      description: 'Created new book',
      createdAt: new Date(),
    }),
  };

  const mockAuditLogModel = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
    sequelize: {
      fn: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getModelToken(AuditLog),
          useValue: mockAuditLogModel,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    auditLogModel = module.get(getModelToken(AuditLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logCreate', () => {
    const createAuditParams = {
      userId: 'user-id',
      tableName: 'books',
      recordId: 'book-id',
      newValues: { title: 'Test Book', author: 'Test Author' },
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      description: 'Created new book',
    };

    it('should create audit log successfully', async () => {
      mockAuditLogModel.create.mockResolvedValue(mockAuditLog);

      const result = await service.logCreate(createAuditParams);

      expect(mockAuditLogModel.create).toHaveBeenCalledWith({
        action: 'CREATE',
        ...createAuditParams,
      }, {});
      expect(result).toEqual(mockAuditLog);
    });

    it('should handle create without optional fields', async () => {
      const minimalParams = {
        tableName: 'books',
        recordId: 'book-id',
        newValues: { title: 'Test Book' },
      };

      mockAuditLogModel.create.mockResolvedValue(mockAuditLog);

      await service.logCreate(minimalParams);

      expect(mockAuditLogModel.create).toHaveBeenCalledWith({
        action: 'CREATE',
        ...minimalParams,
      }, {});
    });
  });

  describe('logUpdate', () => {
    const updateAuditParams = {
      userId: 'user-id',
      tableName: 'books',
      recordId: 'book-id',
      oldValues: { title: 'Old Title' },
      newValues: { title: 'New Title' },
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      description: 'Updated book title',
    };

    it('should create update audit log successfully', async () => {
      mockAuditLogModel.create.mockResolvedValue(mockAuditLog);

      const result = await service.logUpdate(updateAuditParams);

      expect(mockAuditLogModel.create).toHaveBeenCalledWith({
        action: 'UPDATE',
        ...updateAuditParams,
      }, {});
      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('logDelete', () => {
    const deleteAuditParams = {
      userId: 'user-id',
      tableName: 'books',
      recordId: 'book-id',
      oldValues: { title: 'Deleted Book', author: 'Test Author' },
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      description: 'Deleted book',
    };

    it('should create delete audit log successfully', async () => {
      mockAuditLogModel.create.mockResolvedValue(mockAuditLog);

      const result = await service.logDelete(deleteAuditParams);

      expect(mockAuditLogModel.create).toHaveBeenCalledWith({
        action: 'DELETE',
        ...deleteAuditParams,
      }, {});
      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('logCreateWithTransaction', () => {
    const createAuditParams = {
      userId: 'user-id',
      tableName: 'books',
      recordId: 'book-id',
      newValues: { title: 'Test Book' },
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      description: 'Created new book',
    };

    it('should create audit log with transaction', async () => {
      const mockTransaction = { id: 'transaction-id' };
      mockAuditLogModel.create.mockResolvedValue(mockAuditLog);

      const result = await service.logCreateWithTransaction(createAuditParams, mockTransaction);

      expect(mockAuditLogModel.create).toHaveBeenCalledWith({
        action: 'CREATE',
        ...createAuditParams,
      }, { transaction: mockTransaction });
      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('logUpdateWithTransaction', () => {
    const updateAuditParams = {
      userId: 'user-id',
      tableName: 'books',
      recordId: 'book-id',
      oldValues: { title: 'Old Title' },
      newValues: { title: 'New Title' },
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      description: 'Updated book',
    };

    it('should create update audit log with transaction', async () => {
      const mockTransaction = { id: 'transaction-id' };
      mockAuditLogModel.create.mockResolvedValue(mockAuditLog);

      const result = await service.logUpdateWithTransaction(updateAuditParams, mockTransaction);

      expect(mockAuditLogModel.create).toHaveBeenCalledWith({
        action: 'UPDATE',
        ...updateAuditParams,
      }, { transaction: mockTransaction });
      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('logDeleteWithTransaction', () => {
    const deleteAuditParams = {
      userId: 'user-id',
      tableName: 'books',
      recordId: 'book-id',
      oldValues: { title: 'Deleted Book' },
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      description: 'Deleted book',
    };

    it('should create delete audit log with transaction', async () => {
      const mockTransaction = { id: 'transaction-id' };
      mockAuditLogModel.create.mockResolvedValue(mockAuditLog);

      const result = await service.logDeleteWithTransaction(deleteAuditParams, mockTransaction);

      expect(mockAuditLogModel.create).toHaveBeenCalledWith({
        action: 'DELETE',
        ...deleteAuditParams,
      }, { transaction: mockTransaction });
      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('findAll', () => {
    const findOptions = {
      page: 1,
      limit: 10,
      userId: 'user-id',
      tableName: 'books',
      action: 'CREATE',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
    };

    it('should return paginated audit logs with filters', async () => {
      const mockResult = {
        rows: [mockAuditLog],
        count: 1,
      };

      mockAuditLogModel.findAndCountAll.mockResolvedValue(mockResult);

      const result = await service.findAll(findOptions);

      expect(mockAuditLogModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          userId: findOptions.userId,
          tableName: findOptions.tableName,
          action: findOptions.action,
          createdAt: {
            [Op.between]: [findOptions.startDate, findOptions.endDate],
          },
        },
        offset: 0,
        limit: findOptions.limit,
        order: [['createdAt', 'DESC']],
      });

      expect(result).toEqual({
        logs: mockResult.rows,
        total: mockResult.count,
        page: findOptions.page,
        totalPages: 1,
      });
    });

    it('should return audit logs without filters', async () => {
      const mockResult = {
        rows: [mockAuditLog],
        count: 1,
      };

      mockAuditLogModel.findAndCountAll.mockResolvedValue(mockResult);

      const result = await service.findAll({});

      expect(mockAuditLogModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        offset: 0,
        limit: 10,
        order: [['createdAt', 'DESC']],
      });

      expect(result).toEqual({
        logs: mockResult.rows,
        total: mockResult.count,
        page: 1,
        totalPages: 1,
      });
    });
  });

  describe('findByUserId', () => {
    it('should return audit logs for specific user', async () => {
      mockAuditLogModel.findAll.mockResolvedValue([mockAuditLog]);

      const result = await service.findByUserId('user-id');

      expect(mockAuditLogModel.findAll).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        order: [['createdAt', 'DESC']],
      });

      expect(result).toEqual([mockAuditLog]);
    });
  });

  describe('findByTableName', () => {
    it('should return audit logs for specific table', async () => {
      mockAuditLogModel.findAll.mockResolvedValue([mockAuditLog]);

      const result = await service.findByTableName('books');

      expect(mockAuditLogModel.findAll).toHaveBeenCalledWith({
        where: { tableName: 'books' },
        order: [['createdAt', 'DESC']],
      });

      expect(result).toEqual([mockAuditLog]);
    });
  });

  describe('getAuditStats', () => {
    it('should return audit statistics', async () => {
      const totalLogs = 10;
      const actionStats = [
        { action: 'CREATE', count: '5' },
        { action: 'UPDATE', count: '3' },
        { action: 'DELETE', count: '2' },
      ];
      const tableStats = [
        { tableName: 'books', count: '8' },
        { tableName: 'users', count: '2' },
      ];
      const recentActivity = [mockAuditLog];

      mockAuditLogModel.count.mockResolvedValue(totalLogs);
      mockAuditLogModel.findAll
        .mockResolvedValueOnce(actionStats)
        .mockResolvedValueOnce(tableStats)
        .mockResolvedValueOnce(recentActivity);

      const result = await service.getAuditStats();

      expect(mockAuditLogModel.count).toHaveBeenCalled();
      expect(mockAuditLogModel.findAll).toHaveBeenCalledTimes(3);
      expect(result).toEqual({
        totalLogs,
        actionStats,
        tableStats,
        recentActivity,
      });
    });
  });

  describe('exportToCsv', () => {
    it('should export audit logs to CSV format', async () => {
      const mockLogs = {
        logs: [mockAuditLog],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      const findAllSpy = jest.spyOn(service, 'findAll').mockResolvedValue(mockLogs as any);

      const result = await service.exportToCsv({
        userId: 'user-id',
        tableName: 'books',
      });

      expect(findAllSpy).toHaveBeenCalledWith({
        userId: 'user-id',
        tableName: 'books',
        limit: 10000,
      });

      expect(result).toContain('ID,Fecha/Hora,Acción,Tabla,Registro ID,Usuario ID,IP Address,User Agent,Descripción');
      expect(result).toContain('audit-log-id');
      expect(result).toContain('CREATE');
      expect(result).toContain('books');
    });
  });

  describe('logAuth', () => {
    it('should log authentication actions', async () => {
      const authParams = {
        userId: 'user-id',
        action: 'LOGIN' as const,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        description: 'User logged in',
      };

      mockAuditLogModel.create.mockResolvedValue(mockAuditLog);

      const result = await service.logAuth(authParams);

      expect(mockAuditLogModel.create).toHaveBeenCalledWith({
        action: 'LOGIN',
        tableName: 'users',
        userId: authParams.userId,
        ipAddress: authParams.ipAddress,
        userAgent: authParams.userAgent,
        description: authParams.description,
      }, {});

      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('logExport', () => {
    it('should log export actions', async () => {
      const exportParams = {
        userId: 'user-id',
        tableName: 'books',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        description: 'Books exported to CSV',
      };

      mockAuditLogModel.create.mockResolvedValue(mockAuditLog);

      const result = await service.logExport(exportParams);

      expect(mockAuditLogModel.create).toHaveBeenCalledWith({
        action: 'EXPORT',
        ...exportParams,
      }, {});

      expect(result).toEqual(mockAuditLog);
    });
  });
});