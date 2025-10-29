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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const sequelize_2 = require("sequelize");
let TransactionService = class TransactionService {
    constructor(sequelize) {
        this.sequelize = sequelize;
    }
    async runInTransaction(callback, isolationLevel) {
        const transaction = await this.sequelize.transaction({
            isolationLevel: isolationLevel || sequelize_2.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
        });
        try {
            const result = await callback(transaction);
            await transaction.commit();
            return result;
        }
        catch (error) {
            await transaction.rollback();
            console.error('Transaction rolled back due to error:', error);
            throw error;
        }
    }
    async createTransaction(isolationLevel) {
        return this.sequelize.transaction({
            isolationLevel: isolationLevel || sequelize_2.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
        });
    }
    async runInParallelTransaction(callbacks, isolationLevel) {
        return this.runInTransaction(async (transaction) => {
            return Promise.all(callbacks.map(callback => callback(transaction)));
        }, isolationLevel);
    }
    async runInSequentialTransaction(callbacks, isolationLevel) {
        return this.runInTransaction(async (transaction) => {
            const results = [];
            for (const callback of callbacks) {
                const result = await callback(transaction);
                results.push(result);
            }
            return results;
        }, isolationLevel);
    }
    async runWithSavepoint(transaction, savepointName, callback) {
        await this.sequelize.query(`SAVEPOINT ${savepointName}`, { transaction });
        try {
            const result = await callback(transaction);
            await this.sequelize.query(`RELEASE SAVEPOINT ${savepointName}`, { transaction });
            return result;
        }
        catch (error) {
            await this.sequelize.query(`ROLLBACK TO SAVEPOINT ${savepointName}`, { transaction });
            throw error;
        }
    }
    async getConnectionStats() {
        var _a;
        const config = this.sequelize.config;
        return {
            databaseName: config.database || 'unknown',
            dialect: this.sequelize.getDialect() || 'unknown',
            connectionPoolMax: ((_a = config.pool) === null || _a === void 0 ? void 0 : _a.max) || 5,
        };
    }
    async runInTransactionWithTimeout(callback, timeoutMs = 30000, isolationLevel) {
        return Promise.race([
            this.runInTransaction(callback, isolationLevel),
            new Promise((_, reject) => setTimeout(() => reject(new Error(`Transaction timeout after ${timeoutMs}ms`)), timeoutMs)),
        ]);
    }
};
exports.TransactionService = TransactionService;
exports.TransactionService = TransactionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectConnection)()),
    __metadata("design:paramtypes", [sequelize_2.Sequelize])
], TransactionService);
//# sourceMappingURL=transaction.service.js.map