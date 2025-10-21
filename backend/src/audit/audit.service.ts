import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { AuditLog } from './entities/audit-log.entity';

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog)
    private auditLogModel: typeof AuditLog,
  ) {}

  async createAuditLog(data: {
    userId?: string;
    action: string;
    tableName: string;
    recordId?: string;
    oldValues?: object;
    newValues?: object;
    ipAddress?: string;
    userAgent?: string;
    httpMethod?: string;
    endpoint?: string;
    statusCode?: number;
    description?: string;
    duration?: number;
  }, transaction?: any): Promise<AuditLog> {
    const auditLog = await this.auditLogModel.create(data, transaction ? { transaction } : {});
    
    return auditLog;
  }

  // Métodos específicos para diferentes tipos de operaciones
  async logCreate(params: {
    userId?: string;
    tableName: string;
    recordId: string;
    newValues: object;
    ipAddress?: string;
    userAgent?: string;
    description?: string;
  }): Promise<AuditLog> {
    return this.createAuditLog({
      action: AuditAction.CREATE,
      ...params,
    });
  }

  async logCreateWithTransaction(params: {
    userId?: string;
    tableName: string;
    recordId: string;
    newValues: object;
    ipAddress?: string;
    userAgent?: string;
    description?: string;
  }, transaction: any): Promise<AuditLog> {
    return this.createAuditLog({
      action: AuditAction.CREATE,
      ...params,
    }, transaction);
  }

  async logUpdate(params: {
    userId?: string;
    tableName: string;
    recordId: string;
    oldValues: object;
    newValues: object;
    ipAddress?: string;
    userAgent?: string;
    description?: string;
  }): Promise<AuditLog> {
    return this.createAuditLog({
      action: AuditAction.UPDATE,
      ...params,
    });
  }

  async logUpdateWithTransaction(params: {
    userId?: string;
    tableName: string;
    recordId: string;
    oldValues: object;
    newValues: object;
    ipAddress?: string;
    userAgent?: string;
    description?: string;
  }, transaction: any): Promise<AuditLog> {
    return this.createAuditLog({
      action: AuditAction.UPDATE,
      ...params,
    }, transaction);
  }

  async logDelete(params: {
    userId?: string;
    tableName: string;
    recordId: string;
    oldValues: object;
    ipAddress?: string;
    userAgent?: string;
    description?: string;
  }): Promise<AuditLog> {
    return this.createAuditLog({
      action: AuditAction.DELETE,
      ...params,
    });
  }

  async logDeleteWithTransaction(params: {
    userId?: string;
    tableName: string;
    recordId: string;
    oldValues: object;
    ipAddress?: string;
    userAgent?: string;
    description?: string;
  }, transaction: any): Promise<AuditLog> {
    return this.createAuditLog({
      action: AuditAction.DELETE,
      ...params,
    }, transaction);
  }

  async logRead(params: {
    userId?: string;
    tableName: string;
    recordId?: string;
    ipAddress?: string;
    userAgent?: string;
    description?: string;
  }): Promise<AuditLog> {
    return this.createAuditLog({
      action: AuditAction.READ,
      ...params,
    });
  }

  async logExport(params: {
    userId?: string;
    tableName: string;
    ipAddress?: string;
    userAgent?: string;
    description?: string;
  }): Promise<AuditLog> {
    return this.createAuditLog({
      action: AuditAction.EXPORT,
      ...params,
    });
  }

  async logAuth(params: {
    userId?: string;
    action: 'LOGIN' | 'LOGOUT';
    ipAddress?: string;
    userAgent?: string;
    description?: string;
  }): Promise<AuditLog> {
    return this.createAuditLog({
      action: params.action,
      tableName: 'users',
      userId: params.userId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      description: params.description,
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    tableName?: string;
    startDate?: Date;
    endDate?: Date;
    ipAddress?: string;
  } = {}): Promise<{ logs: AuditLog[]; total: number; page: number; totalPages: number }> {
    const {
      page = 1,
      limit = 10,
      userId,
      action,
      tableName,
      startDate,
      endDate,
      ipAddress,
    } = params;

    const offset = (page - 1) * limit;
    const where: any = {};

    // Aplicar filtros
    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (tableName) {
      where.tableName = tableName;
    }

    if (ipAddress) {
      where.ipAddress = { [Op.iLike]: `%${ipAddress}%` };
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      where.createdAt = {
        [Op.gte]: startDate,
      };
    } else if (endDate) {
      where.createdAt = {
        [Op.lte]: endDate,
      };
    }

    const { rows: logs, count: total } = await this.auditLogModel.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(total / limit);

    return { logs, total, page, totalPages };
  }

  async findByUserId(userId: string): Promise<AuditLog[]> {
    return this.auditLogModel.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
  }

  async findByTableName(tableName: string): Promise<AuditLog[]> {
    return this.auditLogModel.findAll({
      where: { tableName },
      order: [['createdAt', 'DESC']],
    });
  }

  // Estadísticas de auditoría
  async getAuditStats(): Promise<{
    totalLogs: number;
    actionStats: { action: string; count: number }[];
    tableStats: { tableName: string; count: number }[];
    recentActivity: AuditLog[];
  }> {
    const totalLogs = await this.auditLogModel.count();

    // Estadísticas por acción
    const actionStats = await this.auditLogModel.findAll({
      attributes: [
        'action',
        [this.auditLogModel.sequelize.fn('COUNT', '*'), 'count'],
      ],
      group: ['action'],
      raw: true,
    }) as any[];

    // Estadísticas por tabla
    const tableStats = await this.auditLogModel.findAll({
      attributes: [
        'tableName',
        [this.auditLogModel.sequelize.fn('COUNT', '*'), 'count'],
      ],
      group: ['tableName'],
      raw: true,
    }) as any[];

    // Actividad reciente (últimos 10 registros)
    const recentActivity = await this.auditLogModel.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
    });

    return {
      totalLogs,
      actionStats,
      tableStats,
      recentActivity,
    };
  }

  // Exportar logs a CSV
  async exportToCsv(filters?: {
    userId?: string;
    action?: string;
    tableName?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<string> {
    const { logs } = await this.findAll({ ...filters, limit: 10000 }); // Exportar máximo 10k registros

    const headers = [
      'ID',
      'Fecha/Hora',
      'Acción',
      'Tabla',
      'Registro ID',
      'Usuario ID',
      'IP Address',
      'User Agent',
      'Descripción',
    ];

    const csvRows = logs.map(log => [
      log.id,
      log.createdAt.toISOString(),
      log.action,
      log.tableName,
      log.recordId || '',
      log.userId || '',
      log.ipAddress || '',
      log.userAgent || '',
      this.sanitizeForCsv(JSON.stringify(log.oldValues || log.newValues || '')),
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));

    return [headers.join(','), ...csvRows].join('\n');
  }

  private sanitizeForCsv(text: string): string {
    // Remover caracteres problemáticos para CSV
    return text.replace(/[\r\n\t]/g, ' ').substring(0, 200);
  }
}