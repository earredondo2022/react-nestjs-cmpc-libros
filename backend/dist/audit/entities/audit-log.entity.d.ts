import { Model } from 'sequelize-typescript';
export declare class AuditLog extends Model<AuditLog> {
    id: string;
    userId: string;
    action: string;
    tableName: string;
    recordId: string;
    oldValues: object;
    newValues: object;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
}
