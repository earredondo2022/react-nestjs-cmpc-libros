import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';

describe('AuditController', () => {
  let controller: AuditController;
  let auditService: any;

  const mockAuditLog = {
    id: 'audit-log-id',
    userId: 'user-id',
    action: 'CREATE',
    tableName: 'books',
    recordId: 'record-id',
    oldValues: null,
    newValues: { title: 'Test Book' },
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    description: 'Book created',
    createdAt: new Date(),
  };

  const mockAuditService = {
    findAll: jest.fn(),
    getAuditStats: jest.fn(),
    exportToCsv: jest.fn(),
    findByUserId: jest.fn(),
    findByTableName: jest.fn(),
  };

  const mockResponse = {
    setHeader: jest.fn(),
    write: jest.fn(),
    end: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuditController>(AuditController);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLogs', () => {
    it('should return audit logs with default parameters', async () => {
      const mockResult = {
        logs: [mockAuditLog],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      mockAuditService.findAll.mockResolvedValue(mockResult);

      const result = await controller.getLogs();

      expect(mockAuditService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        userId: undefined,
        action: undefined,
        tableName: undefined,
        startDate: undefined,
        endDate: undefined,
        ipAddress: undefined,
      });
      expect(result).toEqual(mockResult);
    });

    it('should return audit logs with custom parameters', async () => {
      const mockResult = {
        logs: [mockAuditLog],
        total: 1,
        page: 2,
        totalPages: 3,
      };

      mockAuditService.findAll.mockResolvedValue(mockResult);

      const result = await controller.getLogs(
        '2', // page
        '5', // limit
        'user-123', // userId
        'UPDATE', // action
        'books', // tableName
        '2023-01-01T00:00:00.000Z', // startDate
        '2023-12-31T23:59:59.999Z', // endDate
        '192.168.1.1' // ipAddress
      );

      expect(mockAuditService.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        userId: 'user-123',
        action: 'UPDATE',
        tableName: 'books',
        startDate: new Date('2023-01-01T00:00:00.000Z'),
        endDate: new Date('2023-12-31T23:59:59.999Z'),
        ipAddress: '192.168.1.1',
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle invalid page and limit parameters', async () => {
      const mockResult = {
        logs: [mockAuditLog],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      mockAuditService.findAll.mockResolvedValue(mockResult);

      const result = await controller.getLogs('invalid', 'invalid');

      expect(mockAuditService.findAll).toHaveBeenCalledWith({
        page: NaN,
        limit: NaN,
        userId: undefined,
        action: undefined,
        tableName: undefined,
        startDate: undefined,
        endDate: undefined,
        ipAddress: undefined,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('getStats', () => {
    it('should return audit statistics', async () => {
      const mockStats = {
        totalLogs: 100,
        actionStats: [
          { action: 'CREATE', count: 40 },
          { action: 'UPDATE', count: 35 },
          { action: 'DELETE', count: 25 },
        ],
        tableStats: [
          { tableName: 'books', count: 60 },
          { tableName: 'users', count: 40 },
        ],
        recentActivity: [mockAuditLog],
      };

      mockAuditService.getAuditStats.mockResolvedValue(mockStats);

      const result = await controller.getStats();

      expect(mockAuditService.getAuditStats).toHaveBeenCalledWith();
      expect(result).toEqual(mockStats);
    });

    it('should handle service error', async () => {
      mockAuditService.getAuditStats.mockRejectedValue(new Error('Database error'));

      await expect(controller.getStats()).rejects.toThrow('Database error');

      expect(mockAuditService.getAuditStats).toHaveBeenCalledWith();
    });
  });

  describe('exportToCsv', () => {
    it('should export audit logs to CSV', async () => {
      const csvData = 'ID,User ID,Action,Table\naudit-1,user-1,CREATE,books';
      
      mockAuditService.exportToCsv.mockResolvedValue(csvData);

      await controller.exportToCsv(
        'user-123',
        'CREATE',
        'books',
        '2023-01-01T00:00:00.000Z',
        '2023-12-31T23:59:59.999Z',
        mockResponse as any
      );

      expect(mockAuditService.exportToCsv).toHaveBeenCalledWith({
        userId: 'user-123',
        action: 'CREATE',
        tableName: 'books',
        startDate: new Date('2023-01-01T00:00:00.000Z'),
        endDate: new Date('2023-12-31T23:59:59.999Z'),
      });

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename="audit_logs_')
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Access-Control-Expose-Headers', 'Content-Disposition');
      expect(mockResponse.write).toHaveBeenCalledWith('\uFEFF'); // BOM
      expect(mockResponse.end).toHaveBeenCalledWith(csvData);
    });

    it('should handle export error', async () => {
      mockAuditService.exportToCsv.mockRejectedValue(new Error('Export failed'));

      await controller.exportToCsv(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error al generar el archivo CSV de auditoría',
      });
    });

    it('should handle export with no filters', async () => {
      const csvData = 'ID,User ID,Action\naudit-1,user-1,CREATE';
      
      mockAuditService.exportToCsv.mockResolvedValue(csvData);

      await controller.exportToCsv(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        mockResponse as any
      );

      expect(mockAuditService.exportToCsv).toHaveBeenCalledWith({
        userId: undefined,
        action: undefined,
        tableName: undefined,
        startDate: undefined,
        endDate: undefined,
      });

      expect(mockResponse.end).toHaveBeenCalledWith(csvData);
    });
  });

  describe('getUserLogs', () => {
    it('should return audit logs for specific user', async () => {
      const userLogs = [mockAuditLog];

      mockAuditService.findByUserId.mockResolvedValue(userLogs);

      const result = await controller.getUserLogs('user-123');

      expect(mockAuditService.findByUserId).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(userLogs);
    });

    it('should handle empty results for user', async () => {
      mockAuditService.findByUserId.mockResolvedValue([]);

      const result = await controller.getUserLogs('non-existent-user');

      expect(mockAuditService.findByUserId).toHaveBeenCalledWith('non-existent-user');
      expect(result).toEqual([]);
    });
  });

  describe('getTableLogs', () => {
    it('should return audit logs for specific table', async () => {
      const tableLogs = [mockAuditLog];

      mockAuditService.findByTableName.mockResolvedValue(tableLogs);

      const result = await controller.getTableLogs('books');

      expect(mockAuditService.findByTableName).toHaveBeenCalledWith('books');
      expect(result).toEqual(tableLogs);
    });

    it('should handle empty results for table', async () => {
      mockAuditService.findByTableName.mockResolvedValue([]);

      const result = await controller.getTableLogs('non-existent-table');

      expect(mockAuditService.findByTableName).toHaveBeenCalledWith('non-existent-table');
      expect(result).toEqual([]);
    });

    it('should handle service error for table logs', async () => {
      mockAuditService.findByTableName.mockRejectedValue(new Error('Service error'));

      await expect(controller.getTableLogs('books')).rejects.toThrow('Service error');

      expect(mockAuditService.findByTableName).toHaveBeenCalledWith('books');
    });
  });
});