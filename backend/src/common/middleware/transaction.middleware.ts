import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/transaction.service';
import { AuditService } from '../../audit/audit.service';

// Extend Request interface to include transaction
declare global {
  namespace Express {
    interface Request {
      transaction?: any;
      transactionId?: string;
      startTime?: number;
    }
  }
}

@Injectable()
export class TransactionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TransactionMiddleware.name);

  // Endpoints that should automatically use transactions
  private readonly transactionalEndpoints = [
    { method: 'POST', path: /\/books$/ },
    { method: 'PUT', path: /\/books\/[^/]+$/ },
    { method: 'PATCH', path: /\/books\/[^/]+$/ },
    { method: 'DELETE', path: /\/books\/[^/]+$/ },
    { method: 'POST', path: /\/books\/batch/ },
    { method: 'POST', path: /\/auth\/register$/ },
    { method: 'POST', path: /\/auth\/change-password$/ },
    { method: 'POST', path: /\/authors$/ },
    { method: 'PUT', path: /\/authors\/[^/]+$/ },
    { method: 'DELETE', path: /\/authors\/[^/]+$/ },
    { method: 'POST', path: /\/publishers$/ },
    { method: 'PUT', path: /\/publishers\/[^/]+$/ },
    { method: 'DELETE', path: /\/publishers\/[^/]+$/ },
    { method: 'POST', path: /\/genres$/ },
    { method: 'PUT', path: /\/genres\/[^/]+$/ },
    { method: 'DELETE', path: /\/genres\/[^/]+$/ },
  ];

  constructor(
    private transactionService: TransactionService,
    private auditService: AuditService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const shouldUseTransaction = this.shouldUseTransaction(req);

    if (!shouldUseTransaction) {
      return next();
    }

    // Generate unique transaction ID for tracking
    const transactionId = this.generateTransactionId();
    req.transactionId = transactionId;
    req.startTime = Date.now();

    this.logger.log(`Starting transaction ${transactionId} for ${req.method} ${req.path}`);

    try {
      await this.transactionService.runInTransaction(async (transaction) => {
        // Attach transaction to request
        req.transaction = transaction;

        // Execute the route handlers
        await this.executeRoute(req, res, next);

        // Log successful transaction
        await this.auditService.logCreateWithTransaction({
          userId: this.extractUserId(req),
          tableName: 'transactions',
          recordId: transactionId,
          newValues: {
            transactionId,
            method: req.method,
            path: req.path,
            status: 'committed',
            duration: Date.now() - req.startTime!,
            userAgent: req.get('User-Agent'),
            ipAddress: this.getClientIP(req),
          },
          ipAddress: this.getClientIP(req),
          userAgent: req.get('User-Agent'),
          description: `Transacción completada exitosamente para ${req.method} ${req.path}`,
        }, transaction);

        this.logger.log(`Transaction ${transactionId} committed successfully`);
      });

    } catch (error) {
      this.logger.error(`Transaction ${transactionId} failed:`, error);

      // Log failed transaction (without transaction since it was rolled back)
      await this.auditService.logCreate({
        userId: this.extractUserId(req),
        tableName: 'transactions',
        recordId: transactionId,
        newValues: {
          transactionId,
          method: req.method,
          path: req.path,
          status: 'rolled_back',
          duration: Date.now() - req.startTime!,
          error: error instanceof Error ? error.message : 'Unknown error',
          userAgent: req.get('User-Agent'),
          ipAddress: this.getClientIP(req),
        },
        ipAddress: this.getClientIP(req),
        userAgent: req.get('User-Agent'),
        description: `Transacción falló y fue revertida para ${req.method} ${req.path}`,
      });

      // Rethrow error to be handled by global exception filter
      throw error;
    }
  }

  /**
   * Check if the request should use a transaction
   */
  private shouldUseTransaction(req: Request): boolean {
    // Skip if transaction is explicitly disabled
    if (req.headers['x-disable-transaction'] === 'true') {
      return false;
    }

    // Skip if transaction already exists (nested transaction handling)
    if (req.transaction) {
      return false;
    }

    // Check if endpoint matches transactional patterns
    return this.transactionalEndpoints.some(endpoint => 
      endpoint.method === req.method && endpoint.path.test(req.path)
    );
  }

  /**
   * Execute route handlers with promise-based approach
   */
  private executeRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    return new Promise((resolve, reject) => {
      let isResolved = false;

      // Listen for response finish event
      res.on('finish', () => {
        if (!isResolved) {
          isResolved = true;
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode} error`));
          } else {
            resolve();
          }
        }
      });

      // Listen for response error event
      res.on('error', (error) => {
        if (!isResolved) {
          isResolved = true;
          reject(error);
        }
      });

      // Handle errors in next function
      const wrappedNext = (error?: any) => {
        if (error && !isResolved) {
          isResolved = true;
          reject(error);
        } else if (!error && !isResolved) {
          // Continue to next middleware/route handler
          next();
        }
      };

      // Set timeout to prevent hanging transactions
      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          reject(new Error('Transaction timeout'));
        }
      }, 30000); // 30 second timeout

      // Clear timeout when resolved/rejected
      const cleanup = () => clearTimeout(timeout);
      
      const originalResolve = resolve;
      const originalReject = reject;
      
      resolve = (...args) => {
        cleanup();
        originalResolve(...args);
      };
      
      reject = (...args) => {
        cleanup();
        originalReject(...args);
      };

      // Call next to continue route processing
      wrappedNext();
    });
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract user ID from request
   */
  private extractUserId(req: Request): string | undefined {
    // Try to get user from JWT payload (set by auth guard)
    if (req.user && typeof req.user === 'object' && 'id' in req.user) {
      return (req.user as any).id;
    }

    // Try to get from custom header
    const userId = req.headers['x-user-id'] as string;
    if (userId) {
      return userId;
    }

    return undefined;
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }
}

/**
 * Configuration decorator for enabling/disabling transactions on specific routes
 */
export const Transactional = (enabled: boolean = true) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    // Add metadata to indicate transaction preference
    Reflect.defineMetadata('transactional', enabled, descriptor.value);
  };
};

/**
 * Decorator to disable transactions for specific routes
 */
export const NoTransaction = () => Transactional(false);