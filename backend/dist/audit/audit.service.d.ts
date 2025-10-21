import { AuditLog } from './entities/audit-log.entity';
export declare enum AuditAction {
    CREATE = "CREATE",
    READ = "READ",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    EXPORT = "EXPORT"
}
export declare class AuditService {
    private auditLogModel;
    constructor(auditLogModel: typeof AuditLog);
    createAuditLog(data: {
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
    }, transaction?: any): Promise<AuditLog>;
    logCreate(params: {
        userId?: string;
        tableName: string;
        recordId: string;
        newValues: object;
        ipAddress?: string;
        userAgent?: string;
        description?: string;
    }): Promise<AuditLog>;
    logCreateWithTransaction(params: {
        userId?: string;
        tableName: string;
        recordId: string;
        newValues: object;
        ipAddress?: string;
        userAgent?: string;
        description?: string;
    }, transaction: any): Promise<AuditLog>;
    logUpdate(params: {
        userId?: string;
        tableName: string;
        recordId: string;
        oldValues: object;
        newValues: object;
        ipAddress?: string;
        userAgent?: string;
        description?: string;
    }): Promise<AuditLog>;
    logUpdateWithTransaction(params: {
        userId?: string;
        tableName: string;
        recordId: string;
        oldValues: object;
        newValues: object;
        ipAddress?: string;
        userAgent?: string;
        description?: string;
    }, transaction: any): Promise<AuditLog>;
    logDelete(params: {
        userId?: string;
        tableName: string;
        recordId: string;
        oldValues: object;
        ipAddress?: string;
        userAgent?: string;
        description?: string;
    }): Promise<AuditLog>;
    logDeleteWithTransaction(params: {
        userId?: string;
        tableName: string;
        recordId: string;
        oldValues: object;
        ipAddress?: string;
        userAgent?: string;
        description?: string;
    }, transaction: any): Promise<AuditLog>;
    logRead(params: {
        userId?: string;
        tableName: string;
        recordId?: string;
        ipAddress?: string;
        userAgent?: string;
        description?: string;
    }): Promise<AuditLog>;
    logExport(params: {
        userId?: string;
        tableName: string;
        ipAddress?: string;
        userAgent?: string;
        description?: string;
    }): Promise<AuditLog>;
    logAuth(params: {
        userId?: string;
        action: 'LOGIN' | 'LOGOUT';
        ipAddress?: string;
        userAgent?: string;
        description?: string;
    }): Promise<AuditLog>;
    findAll(params?: {
        page?: number;
        limit?: number;
        userId?: string;
        action?: string;
        tableName?: string;
        startDate?: Date;
        endDate?: Date;
        ipAddress?: string;
    }): Promise<{
        logs: AuditLog[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findByUserId(userId: string): Promise<AuditLog[]>;
    findByTableName(tableName: string): Promise<AuditLog[]>;
    getAuditStats(): Promise<{
        totalLogs: number;
        actionStats: {
            action: string;
            count: number;
        }[];
        tableStats: {
            tableName: string;
            count: number;
        }[];
        recentActivity: AuditLog[];
    }>;
    exportToCsv(filters?: {
        userId?: string;
        action?: string;
        tableName?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<string>;
    private sanitizeForCsv;
}
