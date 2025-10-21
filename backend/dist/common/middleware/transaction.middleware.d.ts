import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/transaction.service';
import { AuditService } from '../../audit/audit.service';
declare global {
    namespace Express {
        interface Request {
            transaction?: any;
            transactionId?: string;
            startTime?: number;
        }
    }
}
export declare class TransactionMiddleware implements NestMiddleware {
    private transactionService;
    private auditService;
    private readonly logger;
    private readonly transactionalEndpoints;
    constructor(transactionService: TransactionService, auditService: AuditService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
    private shouldUseTransaction;
    private executeRoute;
    private generateTransactionId;
    private extractUserId;
    private getClientIP;
}
export declare const Transactional: (enabled?: boolean) => (target: any, propertyName: string, descriptor: PropertyDescriptor) => void;
export declare const NoTransaction: () => (target: any, propertyName: string, descriptor: PropertyDescriptor) => void;
