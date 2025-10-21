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
exports.AuditService = exports.AuditAction = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const sequelize_2 = require("sequelize");
const audit_log_entity_1 = require("./entities/audit-log.entity");
var AuditAction;
(function (AuditAction) {
    AuditAction["CREATE"] = "CREATE";
    AuditAction["READ"] = "READ";
    AuditAction["UPDATE"] = "UPDATE";
    AuditAction["DELETE"] = "DELETE";
    AuditAction["LOGIN"] = "LOGIN";
    AuditAction["LOGOUT"] = "LOGOUT";
    AuditAction["EXPORT"] = "EXPORT";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
let AuditService = class AuditService {
    constructor(auditLogModel) {
        this.auditLogModel = auditLogModel;
    }
    async createAuditLog(data, transaction) {
        const auditLog = await this.auditLogModel.create(data, transaction ? { transaction } : {});
        return auditLog;
    }
    async logCreate(params) {
        return this.createAuditLog({
            action: AuditAction.CREATE,
            ...params,
        });
    }
    async logCreateWithTransaction(params, transaction) {
        return this.createAuditLog({
            action: AuditAction.CREATE,
            ...params,
        }, transaction);
    }
    async logUpdate(params) {
        return this.createAuditLog({
            action: AuditAction.UPDATE,
            ...params,
        });
    }
    async logUpdateWithTransaction(params, transaction) {
        return this.createAuditLog({
            action: AuditAction.UPDATE,
            ...params,
        }, transaction);
    }
    async logDelete(params) {
        return this.createAuditLog({
            action: AuditAction.DELETE,
            ...params,
        });
    }
    async logDeleteWithTransaction(params, transaction) {
        return this.createAuditLog({
            action: AuditAction.DELETE,
            ...params,
        }, transaction);
    }
    async logRead(params) {
        return this.createAuditLog({
            action: AuditAction.READ,
            ...params,
        });
    }
    async logExport(params) {
        return this.createAuditLog({
            action: AuditAction.EXPORT,
            ...params,
        });
    }
    async logAuth(params) {
        return this.createAuditLog({
            action: params.action,
            tableName: 'users',
            userId: params.userId,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
            description: params.description,
        });
    }
    async findAll(params = {}) {
        const { page = 1, limit = 10, userId, action, tableName, startDate, endDate, ipAddress, } = params;
        const offset = (page - 1) * limit;
        const where = {};
        if (userId) {
            where.userId = userId;
        }
        if (action) {
            where.action = action;
        }
        if (tableName) {
            where.tableName = tableName;
        }
        if (ipAddress) {
            where.ipAddress = { [sequelize_2.Op.iLike]: `%${ipAddress}%` };
        }
        if (startDate && endDate) {
            where.createdAt = {
                [sequelize_2.Op.between]: [startDate, endDate],
            };
        }
        else if (startDate) {
            where.createdAt = {
                [sequelize_2.Op.gte]: startDate,
            };
        }
        else if (endDate) {
            where.createdAt = {
                [sequelize_2.Op.lte]: endDate,
            };
        }
        const { rows: logs, count: total } = await this.auditLogModel.findAndCountAll({
            where,
            offset,
            limit,
            order: [['createdAt', 'DESC']],
        });
        const totalPages = Math.ceil(total / limit);
        return { logs, total, page, totalPages };
    }
    async findByUserId(userId) {
        return this.auditLogModel.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
        });
    }
    async findByTableName(tableName) {
        return this.auditLogModel.findAll({
            where: { tableName },
            order: [['createdAt', 'DESC']],
        });
    }
    async getAuditStats() {
        const totalLogs = await this.auditLogModel.count();
        const actionStats = await this.auditLogModel.findAll({
            attributes: [
                'action',
                [this.auditLogModel.sequelize.fn('COUNT', '*'), 'count'],
            ],
            group: ['action'],
            raw: true,
        });
        const tableStats = await this.auditLogModel.findAll({
            attributes: [
                'tableName',
                [this.auditLogModel.sequelize.fn('COUNT', '*'), 'count'],
            ],
            group: ['tableName'],
            raw: true,
        });
        const recentActivity = await this.auditLogModel.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']],
        });
        return {
            totalLogs,
            actionStats,
            tableStats,
            recentActivity,
        };
    }
    async exportToCsv(filters) {
        const { logs } = await this.findAll({ ...filters, limit: 10000 });
        const headers = [
            'ID',
            'Fecha/Hora',
            'Acción',
            'Tabla',
            'Registro ID',
            'Usuario ID',
            'IP Address',
            'User Agent',
            'Descripción',
        ];
        const csvRows = logs.map(log => [
            log.id,
            log.createdAt.toISOString(),
            log.action,
            log.tableName,
            log.recordId || '',
            log.userId || '',
            log.ipAddress || '',
            log.userAgent || '',
            this.sanitizeForCsv(JSON.stringify(log.oldValues || log.newValues || '')),
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
        return [headers.join(','), ...csvRows].join('\n');
    }
    sanitizeForCsv(text) {
        return text.replace(/[\r\n\t]/g, ' ').substring(0, 200);
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [Object])
], AuditService);
//# sourceMappingURL=audit.service.js.map