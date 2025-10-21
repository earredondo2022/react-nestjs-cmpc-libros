import { Request } from 'express';
import { AuditService } from '../audit/audit.service';
export declare class TestController {
    private auditService;
    constructor(auditService: AuditService);
    testAudit(req: Request, data: any): Promise<{
        message: string;
        auditLogId: string;
        userId: string;
        userFromRequest: any;
    }>;
    testAuditNoAuth(req: Request, data: any): Promise<{
        message: string;
        auditLogId: string;
        userId: string;
    }>;
}
