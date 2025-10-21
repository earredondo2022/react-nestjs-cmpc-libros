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
exports.AuditController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const audit_service_1 = require("./audit.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let AuditController = class AuditController {
    constructor(auditService) {
        this.auditService = auditService;
    }
    async getLogs(page, limit, userId, action, tableName, startDate, endDate, ipAddress) {
        const filters = {
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 10,
            userId,
            action,
            tableName,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            ipAddress,
        };
        return this.auditService.findAll(filters);
    }
    async getStats() {
        return this.auditService.getAuditStats();
    }
    async exportToCsv(userId, action, tableName, startDate, endDate, res) {
        const filters = {
            userId,
            action,
            tableName,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        };
        try {
            const csvData = await this.auditService.exportToCsv(filters);
            const filename = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
            res.write('\uFEFF');
            res.end(csvData);
        }
        catch (error) {
            console.error('Error exporting audit logs to CSV:', error);
            res.status(500).json({ message: 'Error al generar el archivo CSV de auditoría' });
        }
    }
    async getUserLogs(userId) {
        return this.auditService.findByUserId(userId);
    }
    async getTableLogs(tableName) {
        return this.auditService.findByTableName(tableName);
    }
};
exports.AuditController = AuditController;
__decorate([
    (0, common_1.Get)('logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit logs with filters' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Audit logs retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Items per page' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, type: String, description: 'Filter by user ID' }),
    (0, swagger_1.ApiQuery)({ name: 'action', required: false, type: String, description: 'Filter by action' }),
    (0, swagger_1.ApiQuery)({ name: 'tableName', required: false, type: String, description: 'Filter by table name' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String, description: 'Start date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String, description: 'End date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'ipAddress', required: false, type: String, description: 'Filter by IP address' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('userId')),
    __param(3, (0, common_1.Query)('action')),
    __param(4, (0, common_1.Query)('tableName')),
    __param(5, (0, common_1.Query)('startDate')),
    __param(6, (0, common_1.Query)('endDate')),
    __param(7, (0, common_1.Query)('ipAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Audit statistics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('export/csv'),
    (0, swagger_1.ApiOperation)({ summary: 'Export audit logs to CSV' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'CSV file generated successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, type: String, description: 'Filter by user ID' }),
    (0, swagger_1.ApiQuery)({ name: 'action', required: false, type: String, description: 'Filter by action' }),
    (0, swagger_1.ApiQuery)({ name: 'tableName', required: false, type: String, description: 'Filter by table name' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String, description: 'Start date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String, description: 'End date (ISO string)' }),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('action')),
    __param(2, (0, common_1.Query)('tableName')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __param(5, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "exportToCsv", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit logs for specific user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User audit logs retrieved successfully' }),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getUserLogs", null);
__decorate([
    (0, common_1.Get)('table/:tableName'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit logs for specific table' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Table audit logs retrieved successfully' }),
    __param(0, (0, common_1.Query)('tableName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getTableLogs", null);
exports.AuditController = AuditController = __decorate([
    (0, swagger_1.ApiTags)('Audit'),
    (0, common_1.Controller)('audit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditController);
//# sourceMappingURL=audit.controller.js.map