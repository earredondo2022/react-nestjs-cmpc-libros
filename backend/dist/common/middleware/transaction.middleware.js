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
var TransactionMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoTransaction = exports.Transactional = exports.TransactionMiddleware = void 0;
const common_1 = require("@nestjs/common");
const transaction_service_1 = require("../services/transaction.service");
const audit_service_1 = require("../../audit/audit.service");
let TransactionMiddleware = TransactionMiddleware_1 = class TransactionMiddleware {
    constructor(transactionService, auditService) {
        this.transactionService = transactionService;
        this.auditService = auditService;
        this.logger = new common_1.Logger(TransactionMiddleware_1.name);
        this.transactionalEndpoints = [
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
    }
    async use(req, res, next) {
        const shouldUseTransaction = this.shouldUseTransaction(req);
        if (!shouldUseTransaction) {
            return next();
        }
        const transactionId = this.generateTransactionId();
        req.transactionId = transactionId;
        req.startTime = Date.now();
        this.logger.log(`Starting transaction ${transactionId} for ${req.method} ${req.path}`);
        try {
            await this.transactionService.runInTransaction(async (transaction) => {
                req.transaction = transaction;
                await this.executeRoute(req, res, next);
                await this.auditService.logCreateWithTransaction({
                    userId: this.extractUserId(req),
                    tableName: 'transactions',
                    recordId: transactionId,
                    newValues: {
                        transactionId,
                        method: req.method,
                        path: req.path,
                        status: 'committed',
                        duration: Date.now() - req.startTime,
                        userAgent: req.get('User-Agent'),
                        ipAddress: this.getClientIP(req),
                    },
                    ipAddress: this.getClientIP(req),
                    userAgent: req.get('User-Agent'),
                    description: `Transacción completada exitosamente para ${req.method} ${req.path}`,
                }, transaction);
                this.logger.log(`Transaction ${transactionId} committed successfully`);
            });
        }
        catch (error) {
            this.logger.error(`Transaction ${transactionId} failed:`, error);
            await this.auditService.logCreate({
                userId: this.extractUserId(req),
                tableName: 'transactions',
                recordId: transactionId,
                newValues: {
                    transactionId,
                    method: req.method,
                    path: req.path,
                    status: 'rolled_back',
                    duration: Date.now() - req.startTime,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    userAgent: req.get('User-Agent'),
                    ipAddress: this.getClientIP(req),
                },
                ipAddress: this.getClientIP(req),
                userAgent: req.get('User-Agent'),
                description: `Transacción falló y fue revertida para ${req.method} ${req.path}`,
            });
            throw error;
        }
    }
    shouldUseTransaction(req) {
        if (req.headers['x-disable-transaction'] === 'true') {
            return false;
        }
        if (req.transaction) {
            return false;
        }
        return this.transactionalEndpoints.some(endpoint => endpoint.method === req.method && endpoint.path.test(req.path));
    }
    executeRoute(req, res, next) {
        return new Promise((resolve, reject) => {
            let isResolved = false;
            res.on('finish', () => {
                if (!isResolved) {
                    isResolved = true;
                    if (res.statusCode >= 400) {
                        reject(new Error(`HTTP ${res.statusCode} error`));
                    }
                    else {
                        resolve();
                    }
                }
            });
            res.on('error', (error) => {
                if (!isResolved) {
                    isResolved = true;
                    reject(error);
                }
            });
            const wrappedNext = (error) => {
                if (error && !isResolved) {
                    isResolved = true;
                    reject(error);
                }
                else if (!error && !isResolved) {
                    next();
                }
            };
            const timeout = setTimeout(() => {
                if (!isResolved) {
                    isResolved = true;
                    reject(new Error('Transaction timeout'));
                }
            }, 30000);
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
            wrappedNext();
        });
    }
    generateTransactionId() {
        return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    extractUserId(req) {
        if (req.user && typeof req.user === 'object' && 'id' in req.user) {
            return req.user.id;
        }
        const userId = req.headers['x-user-id'];
        if (userId) {
            return userId;
        }
        return undefined;
    }
    getClientIP(req) {
        var _a, _b;
        return (req.headers['x-forwarded-for'] ||
            req.headers['x-real-ip'] ||
            ((_a = req.connection) === null || _a === void 0 ? void 0 : _a.remoteAddress) ||
            ((_b = req.socket) === null || _b === void 0 ? void 0 : _b.remoteAddress) ||
            'unknown');
    }
};
exports.TransactionMiddleware = TransactionMiddleware;
exports.TransactionMiddleware = TransactionMiddleware = TransactionMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [transaction_service_1.TransactionService,
        audit_service_1.AuditService])
], TransactionMiddleware);
const Transactional = (enabled = true) => {
    return (target, propertyName, descriptor) => {
        Reflect.defineMetadata('transactional', enabled, descriptor.value);
    };
};
exports.Transactional = Transactional;
const NoTransaction = () => (0, exports.Transactional)(false);
exports.NoTransaction = NoTransaction;
//# sourceMappingURL=transaction.middleware.js.map