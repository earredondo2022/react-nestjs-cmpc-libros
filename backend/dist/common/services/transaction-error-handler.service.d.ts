import { AuditService } from '../../audit/audit.service';
export declare enum TransactionErrorType {
    DEADLOCK = "DEADLOCK",
    TIMEOUT = "TIMEOUT",
    CONSTRAINT_VIOLATION = "CONSTRAINT_VIOLATION",
    CONNECTION_ERROR = "CONNECTION_ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    BUSINESS_LOGIC_ERROR = "BUSINESS_LOGIC_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export interface TransactionError {
    type: TransactionErrorType;
    message: string;
    originalError?: Error;
    context?: {
        operation?: string;
        entityType?: string;
        entityId?: string;
        userId?: string;
        transactionId?: string;
        retryable?: boolean;
    };
}
export interface RetryStrategy {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffFactor: number;
    retryableErrors: TransactionErrorType[];
}
export declare class TransactionErrorHandler {
    private auditService;
    private readonly logger;
    private readonly defaultRetryStrategy;
    constructor(auditService: AuditService);
    handleTransactionError(error: Error, context?: {
        operation?: string;
        entityType?: string;
        entityId?: string;
        userId?: string;
        transactionId?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<TransactionError>;
    executeWithRetry<T>(operation: () => Promise<T>, context?: {
        operation?: string;
        entityType?: string;
        entityId?: string;
        userId?: string;
        transactionId?: string;
    }, retryStrategy?: Partial<RetryStrategy>): Promise<T>;
    private classifyError;
    private transformToHttpError;
    private getConstraintViolationMessage;
    private logTransactionError;
    private delay;
    createRetryStrategy(overrides: Partial<RetryStrategy>): RetryStrategy;
    isRetryable(errorType: TransactionErrorType): boolean;
}
