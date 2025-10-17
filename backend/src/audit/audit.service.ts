import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuditLog } from './entities/audit-log.entity';

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
  }): Promise<AuditLog> {
    return this.auditLogModel.create(data);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ logs: AuditLog[]; total: number }> {
    const offset = (page - 1) * limit;
    
    const { rows: logs, count: total } = await this.auditLogModel.findAndCountAll({
      offset,
      limit,
      order: [['createdAt', 'DESC']],
      include: ['user'],
    });

    return { logs, total };
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
}