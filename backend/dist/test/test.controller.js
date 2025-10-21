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
exports.TestController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const audit_service_1 = require("../audit/audit.service");
let TestController = class TestController {
    constructor(auditService) {
        this.auditService = auditService;
    }
    async testAudit(req, data) {
        const userId = req.user?.id;
        const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const auditLog = await this.auditService.logCreate({
            userId,
            tableName: 'test',
            recordId: 'TEST-' + Date.now(),
            newValues: { test: true, data },
            ipAddress,
            userAgent,
            description: 'Prueba de logging de auditoría',
        });
        return {
            message: 'Audit log created successfully',
            auditLogId: auditLog.id,
            userId: auditLog.userId,
            userFromRequest: userId,
        };
    }
    async testAuditNoAuth(req, data) {
        const userId = '1';
        const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const auditLog = await this.auditService.logCreate({
            userId,
            tableName: 'test',
            recordId: 'TEST-NOAUTH-' + Date.now(),
            newValues: { test: true, data, authRequired: false },
            ipAddress,
            userAgent,
            description: 'Prueba de logging de auditoría sin autenticación',
        });
        return {
            message: 'Audit log created successfully (no auth)',
            auditLogId: auditLog.id,
            userId: auditLog.userId,
        };
    }
};
exports.TestController = TestController;
__decorate([
    (0, common_1.Post)('audit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Test audit logging' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "testAudit", null);
__decorate([
    (0, common_1.Post)('audit-no-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Test audit logging without auth' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "testAuditNoAuth", null);
exports.TestController = TestController = __decorate([
    (0, swagger_1.ApiTags)('Test'),
    (0, common_1.Controller)('test'),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], TestController);
//# sourceMappingURL=test.controller.js.map