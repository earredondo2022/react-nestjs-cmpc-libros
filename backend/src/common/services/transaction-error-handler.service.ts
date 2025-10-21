import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { AuditService } from '../../audit/audit.service';

export enum TransactionErrorType {
  DEADLOCK = 'DEADLOCK',
  TIMEOUT = 'TIMEOUT',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
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

@Injectable()
export class TransactionErrorHandler {
  private readonly logger = new Logger(TransactionErrorHandler.name);

  private readonly defaultRetryStrategy: RetryStrategy = {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffFactor: 2,
    retryableErrors: [
      TransactionErrorType.DEADLOCK,
      TransactionErrorType.TIMEOUT,
      TransactionErrorType.CONNECTION_ERROR,
    ],
  };

  constructor(private auditService: AuditService) {}

  /**
   * Classify and handle transaction errors
   */
  async handleTransactionError(
    error: Error,
    context?: {
      operation?: string;
      entityType?: string;
      entityId?: string;
      userId?: string;
      transactionId?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<TransactionError> {
    const transactionError = this.classifyError(error, context);

    // Log the error
    await this.logTransactionError(transactionError, context);

    // Determine if error should be rethrown or transformed
    const httpError = this.transformToHttpError(transactionError);
    
    this.logger.error(
      `Transaction error [${transactionError.type}]: ${transactionError.message}`,
      {
        context,
        originalError: error.stack,
      }
    );

    throw httpError;
  }

  /**
   * Execute operation with retry logic for transient failures
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: {
      operation?: string;
      entityType?: string;
      entityId?: string;
      userId?: string;
      transactionId?: string;
    },
    retryStrategy: Partial<RetryStrategy> = {}
  ): Promise<T> {
    const strategy = { ...this.defaultRetryStrategy, ...retryStrategy };
    let lastError: TransactionError | null = null;

    for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        // Log successful retry if this wasn't the first attempt
        if (attempt > 1) {
          this.logger.log(`Operation succeeded on attempt ${attempt}/${strategy.maxAttempts}`, context);
          
          await this.auditService.logCreate({
            userId: context?.userId,
            tableName: 'transaction_retries',
            recordId: context?.transactionId || 'unknown',
            newValues: {
              operation: context?.operation,
              entityType: context?.entityType,
              entityId: context?.entityId,
              attempt,
              maxAttempts: strategy.maxAttempts,
              status: 'success',
              lastError: lastError?.message,
            },
            description: `Operación exitosa después de ${attempt} intentos`,
          });
        }

        return result;

      } catch (error) {
        lastError = this.classifyError(error as Error, context);

        // Check if error is retryable
        const isRetryable = strategy.retryableErrors.includes(lastError.type);
        const isLastAttempt = attempt === strategy.maxAttempts;

        this.logger.warn(
          `Attempt ${attempt}/${strategy.maxAttempts} failed: ${lastError.message}. Retryable: ${isRetryable}`,
          context
        );

        // If not retryable or last attempt, throw error
        if (!isRetryable || isLastAttempt) {
          await this.auditService.logCreate({
            userId: context?.userId,
            tableName: 'transaction_retries',
            recordId: context?.transactionId || 'unknown',
            newValues: {
              operation: context?.operation,
              entityType: context?.entityType,
              entityId: context?.entityId,
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

        // Calculate delay for next attempt
        const delay = Math.min(
          strategy.baseDelay * Math.pow(strategy.backoffFactor, attempt - 1),
          strategy.maxDelay
        );

        this.logger.log(`Retrying in ${delay}ms...`);
        await this.delay(delay);
      }
    }

    // This should never be reached, but just in case
    throw this.transformToHttpError(lastError!);
  }

  /**
   * Classify error type based on error details
   */
  private classifyError(error: Error, context?: any): TransactionError {
    const message = error.message.toLowerCase();

    // Deadlock detection
    if (message.includes('deadlock') || message.includes('lock wait timeout')) {
      return {
        type: TransactionErrorType.DEADLOCK,
        message: 'Database deadlock detected. Please retry the operation.',
        originalError: error,
        context: { ...context, retryable: true },
      };
    }

    // Timeout detection
    if (message.includes('timeout') || message.includes('connection timeout')) {
      return {
        type: TransactionErrorType.TIMEOUT,
        message: 'Operation timed out. Please try again.',
        originalError: error,
        context: { ...context, retryable: true },
      };
    }

    // Constraint violations
    if (
      message.includes('constraint') ||
      message.includes('unique') ||
      message.includes('foreign key') ||
      message.includes('duplicate entry')
    ) {
      return {
        type: TransactionErrorType.CONSTRAINT_VIOLATION,
        message: this.getConstraintViolationMessage(error.message),
        originalError: error,
        context: { ...context, retryable: false },
      };
    }

    // Connection errors
    if (
      message.includes('connection') ||
      message.includes('connect') ||
      message.includes('econnrefused') ||
      message.includes('etimedout')
    ) {
      return {
        type: TransactionErrorType.CONNECTION_ERROR,
        message: 'Database connection error. Please try again.',
        originalError: error,
        context: { ...context, retryable: true },
      };
    }

    // Validation errors (business logic)
    if (error instanceof HttpException && error.getStatus() < 500) {
      return {
        type: TransactionErrorType.VALIDATION_ERROR,
        message: error.message,
        originalError: error,
        context: { ...context, retryable: false },
      };
    }

    // Business logic errors (custom exceptions)
    if (error.name.includes('BusinessLogicError') || error.name.includes('DomainError')) {
      return {
        type: TransactionErrorType.BUSINESS_LOGIC_ERROR,
        message: error.message,
        originalError: error,
        context: { ...context, retryable: false },
      };
    }

    // Unknown errors
    return {
      type: TransactionErrorType.UNKNOWN_ERROR,
      message: 'An unexpected error occurred during the transaction.',
      originalError: error,
      context: { ...context, retryable: false },
    };
  }

  /**
   * Transform transaction error to appropriate HTTP error
   */
  private transformToHttpError(transactionError: TransactionError): HttpException {
    switch (transactionError.type) {
      case TransactionErrorType.DEADLOCK:
        return new HttpException(
          {
            error: 'Conflict',
            message: transactionError.message,
            code: 'DEADLOCK_DETECTED',
            retryable: true,
          },
          HttpStatus.CONFLICT
        );

      case TransactionErrorType.TIMEOUT:
        return new HttpException(
          {
            error: 'Request Timeout',
            message: transactionError.message,
            code: 'OPERATION_TIMEOUT',
            retryable: true,
          },
          HttpStatus.REQUEST_TIMEOUT
        );

      case TransactionErrorType.CONSTRAINT_VIOLATION:
        return new HttpException(
          {
            error: 'Bad Request',
            message: transactionError.message,
            code: 'CONSTRAINT_VIOLATION',
            retryable: false,
          },
          HttpStatus.BAD_REQUEST
        );

      case TransactionErrorType.CONNECTION_ERROR:
        return new HttpException(
          {
            error: 'Service Unavailable',
            message: transactionError.message,
            code: 'DATABASE_CONNECTION_ERROR',
            retryable: true,
          },
          HttpStatus.SERVICE_UNAVAILABLE
        );

      case TransactionErrorType.VALIDATION_ERROR:
      case TransactionErrorType.BUSINESS_LOGIC_ERROR:
        // Preserve original HTTP error if available
        if (transactionError.originalError instanceof HttpException) {
          return transactionError.originalError;
        }
        return new HttpException(
          {
            error: 'Bad Request',
            message: transactionError.message,
            code: 'VALIDATION_ERROR',
            retryable: false,
          },
          HttpStatus.BAD_REQUEST
        );

      case TransactionErrorType.UNKNOWN_ERROR:
      default:
        return new HttpException(
          {
            error: 'Internal Server Error',
            message: 'An unexpected error occurred. Please try again later.',
            code: 'INTERNAL_ERROR',
            retryable: false,
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
  }

  /**
   * Get user-friendly constraint violation message
   */
  private getConstraintViolationMessage(errorMessage: string): string {
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

  /**
   * Log transaction error for audit purposes
   */
  private async logTransactionError(
    transactionError: TransactionError,
    context?: {
      operation?: string;
      entityType?: string;
      entityId?: string;
      userId?: string;
      transactionId?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      await this.auditService.logCreate({
        userId: context?.userId,
        tableName: 'transaction_errors',
        recordId: context?.transactionId || 'unknown',
        newValues: {
          errorType: transactionError.type,
          errorMessage: transactionError.message,
          operation: context?.operation,
          entityType: context?.entityType,
          entityId: context?.entityId,
          retryable: transactionError.context?.retryable,
          originalError: transactionError.originalError?.message,
          stackTrace: transactionError.originalError?.stack,
        },
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        description: `Error en transacción: ${transactionError.type} - ${transactionError.message}`,
      });
    } catch (auditError) {
      // Don't let audit logging errors interfere with main error handling
      this.logger.error('Failed to log transaction error to audit:', auditError);
    }
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create custom retry strategy for specific operations
   */
  createRetryStrategy(overrides: Partial<RetryStrategy>): RetryStrategy {
    return { ...this.defaultRetryStrategy, ...overrides };
  }

  /**
   * Check if error type is retryable
   */
  isRetryable(errorType: TransactionErrorType): boolean {
    return this.defaultRetryStrategy.retryableErrors.includes(errorType);
  }
}