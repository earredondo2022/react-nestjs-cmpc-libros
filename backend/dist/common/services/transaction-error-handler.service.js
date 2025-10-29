"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TransactionErrorHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionErrorHandler = exports.TransactionErrorType = void 0;
const common_1 = require("@nestjs/common");
const audit_service_1 = require("../../audit/audit.service");
var TransactionErrorType;
(function (TransactionErrorType) {
    TransactionErrorType["DEADLOCK"] = "DEADLOCK";
    TransactionErrorType["TIMEOUT"] = "TIMEOUT";
    TransactionErrorType["CONSTRAINT_VIOLATION"] = "CONSTRAINT_VIOLATION";
    TransactionErrorType["CONNECTION_ERROR"] = "CONNECTION_ERROR";
    TransactionErrorType["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    TransactionErrorType["BUSINESS_LOGIC_ERROR"] = "BUSINESS_LOGIC_ERROR";
    TransactionErrorType["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(TransactionErrorType || (exports.TransactionErrorType = TransactionErrorType = {}));
let TransactionErrorHandler = TransactionErrorHandler_1 = class TransactionErrorHandler {
    constructor(auditService) {
        this.auditService = auditService;
        this.logger = new common_1.Logger(TransactionErrorHandler_1.name);
        this.defaultRetryStrategy = {
            maxAttempts: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            backoffFactor: 2,
            retryableErrors: [
                TransactionErrorType.DEADLOCK,
                TransactionErrorType.TIMEOUT,
                TransactionErrorType.CONNECTION_ERROR,
            ],
        };
    }
    async handleTransactionError(error, context) {
        const transactionError = this.classifyError(error, context);
        await this.logTransactionError(transactionError, context);
        const httpError = this.transformToHttpError(transactionError);
        this.logger.error(`Transaction error [${transactionError.type}]: ${transactionError.message}`, {
            context,
            originalError: error.stack,
        });
        throw httpError;
    }
    async executeWithRetry(operation, context, retryStrategy = {}) {
        const strategy = { ...this.defaultRetryStrategy, ...retryStrategy };
        let lastError = null;
        for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
            try {
                const result = await operation();
                if (attempt > 1) {
                    this.logger.log(`Operation succeeded on attempt ${attempt}/${strategy.maxAttempts}`, context);
                    await this.auditService.logCreate({
                        userId: context === null || context === void 0 ? void 0 : context.userId,
                        tableName: 'transaction_retries',
                        recordId: (context === null || context === void 0 ? void 0 : context.transactionId) || 'unknown',
                        newValues: {
                            operation: context === null || context === void 0 ? void 0 : context.operation,
                            entityType: context === null || context === void 0 ? void 0 : context.entityType,
                            entityId: context === null || context === void 0 ? void 0 : context.entityId,
                            attempt,
                            maxAttempts: strategy.maxAttempts,
                            status: 'success',
                            lastError: lastError === null || lastError === void 0 ? void 0 : lastError.message,
                        },
                        description: `Operación exitosa después de ${attempt} intentos`,
                    });
                }
                return result;
            }
            catch (error) {
                lastError = this.classifyError(error, context);
                const isRetryable = strategy.retryableErrors.includes(lastError.type);
                const isLastAttempt = attempt === strategy.maxAttempts;
                this.logger.warn(`Attempt ${attempt}/${strategy.maxAttempts} failed: ${lastError.message}. Retryable: ${isRetryable}`, context);
                if (!isRetryable || isLastAttempt) {
                    await this.auditService.logCreate({
                        userId: context === null || context === void 0 ? void 0 : context.userId,
                        tableName: 'transaction_retries',
                        recordId: (context === null || context === void 0 ? void 0 : context.transactionId) || 'unknown',
                        newValues: {
                            operation: context === null || context === void 0 ? void 0 : context.operation,
                            entityType: context === null || context === void 0 ? void 0 : context.entityType,
                            entityId: context === null || context === void 0 ? void 0 : context.entityId,
                            attempt,
                            maxAttempts: strategy.maxAttempts,
                            status: 'failed',
                            error: lastError.message,
                            errorType: lastError.type,
                            retryable: isRetryable,
                        },
                        description: `Operación falló definitivamente después de ${attempt} intentos`,
                    });
                    throw this.transformToHttpError(lastError);
                }
                const delay = Math.min(strategy.baseDelay * Math.pow(strategy.backoffFactor, attempt - 1), strategy.maxDelay);
                this.logger.log(`Retrying in ${delay}ms...`);
                await this.delay(delay);
            }
        }
        throw this.transformToHttpError(lastError);
    }
    classifyError(error, context) {
        const message = error.message.toLowerCase();
        if (message.includes('deadlock') || message.includes('lock wait timeout')) {
            return {
                type: TransactionErrorType.DEADLOCK,
                message: 'Database deadlock detected. Please retry the operation.',
                originalError: error,
                context: { ...context, retryable: true },
            };
        }
        if (message.includes('timeout') || message.includes('connection timeout')) {
            return {
                type: TransactionErrorType.TIMEOUT,
                message: 'Operation timed out. Please try again.',
                originalError: error,
                context: { ...context, retryable: true },
            };
        }
        if (message.includes('constraint') ||
            message.includes('unique') ||
            message.includes('foreign key') ||
            message.includes('duplicate entry')) {
            return {
                type: TransactionErrorType.CONSTRAINT_VIOLATION,
                message: this.getConstraintViolationMessage(error.message),
                originalError: error,
                context: { ...context, retryable: false },
            };
        }
        if (message.includes('connection') ||
            message.includes('connect') ||
            message.includes('econnrefused') ||
            message.includes('etimedout')) {
            return {
                type: TransactionErrorType.CONNECTION_ERROR,
                message: 'Database connection error. Please try again.',
                originalError: error,
                context: { ...context, retryable: true },
            };
        }
        if (error instanceof common_1.HttpException && error.getStatus() < 500) {
            return {
                type: TransactionErrorType.VALIDATION_ERROR,
                message: error.message,
                originalError: error,
                context: { ...context, retryable: false },
            };
        }
        if (error.name.includes('BusinessLogicError') || error.name.includes('DomainError')) {
            return {
                type: TransactionErrorType.BUSINESS_LOGIC_ERROR,
                message: error.message,
                originalError: error,
                context: { ...context, retryable: false },
            };
        }
        return {
            type: TransactionErrorType.UNKNOWN_ERROR,
            message: 'An unexpected error occurred during the transaction.',
            originalError: error,
            context: { ...context, retryable: false },
        };
    }
    transformToHttpError(transactionError) {
        switch (transactionError.type) {
            case TransactionErrorType.DEADLOCK:
                return new common_1.HttpException({
                    error: 'Conflict',
                    message: transactionError.message,
                    code: 'DEADLOCK_DETECTED',
                    retryable: true,
                }, common_1.HttpStatus.CONFLICT);
            case TransactionErrorType.TIMEOUT:
                return new common_1.HttpException({
                    error: 'Request Timeout',
                    message: transactionError.message,
                    code: 'OPERATION_TIMEOUT',
                    retryable: true,
                }, common_1.HttpStatus.REQUEST_TIMEOUT);
            case TransactionErrorType.CONSTRAINT_VIOLATION:
                return new common_1.HttpException({
                    error: 'Bad Request',
                    message: transactionError.message,
                    code: 'CONSTRAINT_VIOLATION',
                    retryable: false,
                }, common_1.HttpStatus.BAD_REQUEST);
            case TransactionErrorType.CONNECTION_ERROR:
                return new common_1.HttpException({
                    error: 'Service Unavailable',
                    message: transactionError.message,
                    code: 'DATABASE_CONNECTION_ERROR',
                    retryable: true,
                }, common_1.HttpStatus.SERVICE_UNAVAILABLE);
            case TransactionErrorType.VALIDATION_ERROR:
            case TransactionErrorType.BUSINESS_LOGIC_ERROR:
                if (transactionError.originalError instanceof common_1.HttpException) {
                    return transactionError.originalError;
                }
                return new common_1.HttpException({
                    error: 'Bad Request',
                    message: transactionError.message,
                    code: 'VALIDATION_ERROR',
                    retryable: false,
                }, common_1.HttpStatus.BAD_REQUEST);
            case TransactionErrorType.UNKNOWN_ERROR:
            default:
                return new common_1.HttpException({
                    error: 'Internal Server Error',
                    message: 'An unexpected error occurred. Please try again later.',
                    code: 'INTERNAL_ERROR',
                    retryable: false,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    getConstraintViolationMessage(errorMessage) {
        const message = errorMessage.toLowerCase();
        if (message.includes('duplicate entry') || message.includes('unique')) {
            if (message.includes('email')) {
                return 'This email address is already registered.';
            }
            if (message.includes('isbn')) {
                return 'A book with this ISBN already exists.';
            }
            return 'This record already exists. Please check your data.';
        }
        if (message.includes('foreign key')) {
            return 'Cannot complete operation due to related data constraints.';
        }
        if (message.includes('check constraint')) {
            return 'Data validation failed. Please check your input values.';
        }
        if (message.includes('not null')) {
            return 'Required fields are missing. Please fill all mandatory fields.';
        }
        return 'Data constraint violation. Please check your input and try again.';
    }
    async logTransactionError(transactionError, context) {
        var _a, _b, _c;
        try {
            await this.auditService.logCreate({
                userId: context === null || context === void 0 ? void 0 : context.userId,
                tableName: 'transaction_errors',
                recordId: (context === null || context === void 0 ? void 0 : context.transactionId) || 'unknown',
                newValues: {
                    errorType: transactionError.type,
                    errorMessage: transactionError.message,
                    operation: context === null || context === void 0 ? void 0 : context.operation,
                    entityType: context === null || context === void 0 ? void 0 : context.entityType,
                    entityId: context === null || context === void 0 ? void 0 : context.entityId,
                    retryable: (_a = transactionError.context) === null || _a === void 0 ? void 0 : _a.retryable,
                    originalError: (_b = transactionError.originalError) === null || _b === void 0 ? void 0 : _b.message,
                    stackTrace: (_c = transactionError.originalError) === null || _c === void 0 ? void 0 : _c.stack,
                },
                ipAddress: context === null || context === void 0 ? void 0 : context.ipAddress,
                userAgent: context === null || context === void 0 ? void 0 : context.userAgent,
                description: `Error en transacción: ${transactionError.type} - ${transactionError.message}`,
            });
        }
        catch (auditError) {
            this.logger.error('Failed to log transaction error to audit:', auditError);
        }
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    createRetryStrategy(overrides) {
        return { ...this.defaultRetryStrategy, ...overrides };
    }
    isRetryable(errorType) {
        return this.defaultRetryStrategy.retryableErrors.includes(errorType);
    }
};
exports.TransactionErrorHandler = TransactionErrorHandler;
exports.TransactionErrorHandler = TransactionErrorHandler = TransactionErrorHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], TransactionErrorHandler);
//# sourceMappingURL=transaction-error-handler.service.js.map