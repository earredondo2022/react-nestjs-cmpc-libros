import { Response } from 'express';
import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    getLogs(page?: string, limit?: string, userId?: string, action?: string, tableName?: string, startDate?: string, endDate?: string, ipAddress?: string): Promise<{
        logs: import("./entities/audit-log.entity").AuditLog[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getStats(): Promise<{
        totalLogs: number;
        actionStats: {
            action: string;
            count: number;
        }[];
        tableStats: {
            tableName: string;
            count: number;
        }[];
        recentActivity: import("./entities/audit-log.entity").AuditLog[];
    }>;
    exportToCsv(userId?: string, action?: string, tableName?: string, startDate?: string, endDate?: string, res?: Response): Promise<void>;
    getUserLogs(userId: string): Promise<import("./entities/audit-log.entity").AuditLog[]>;
    getTableLogs(tableName: string): Promise<import("./entities/audit-log.entity").AuditLog[]>;
}
