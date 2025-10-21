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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const audit_service_1 = require("./audit.service");
let AuditInterceptor = class AuditInterceptor {
    constructor(auditService) {
        this.auditService = auditService;
    }
    intercept(context, next) {
        const startTime = Date.now();
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const { method: httpMethod, url: endpoint, ip: ipAddress, headers, user, body, params, } = request;
        const userAgent = headers['user-agent'];
        const userId = user?.id;
        if (!this.shouldAudit(httpMethod, endpoint)) {
            return next.handle();
        }
        return next.handle().pipe((0, operators_1.tap)((responseData) => {
            const duration = Date.now() - startTime;
            const statusCode = response.statusCode;
            this.logOperation({
                userId,
                httpMethod,
                endpoint,
                ipAddress,
                userAgent,
                statusCode,
                duration,
                body,
                params,
                responseData,
                success: true,
            });
        }), (0, operators_1.catchError)((error) => {
            const duration = Date.now() - startTime;
            const statusCode = error.status || 500;
            this.logOperation({
                userId,
                httpMethod,
                endpoint,
                ipAddress,
                userAgent,
                statusCode,
                duration,
                body,
                params,
                error: error.message,
                success: false,
            });
            throw error;
        }));
    }
    shouldAudit(method, endpoint) {
        const skipPatterns = [
            '/health',
            '/metrics',
            '/favicon.ico',
            '/api/audit',
        ];
        const isGetOperation = method === 'GET';
        const isHealthCheck = skipPatterns.some(pattern => endpoint.includes(pattern));
        if (isHealthCheck) {
            return false;
        }
        if (!isGetOperation) {
            return true;
        }
        const importantGetPatterns = [
            '/api/books/export',
            '/api/users',
            '/admin',
        ];
        return importantGetPatterns.some(pattern => endpoint.includes(pattern));
    }
    async logOperation(operationParams) {
        const { userId, httpMethod, endpoint, ipAddress, userAgent, statusCode, duration, body, params, responseData, error, success, } = operationParams;
        try {
            const { action, tableName, recordId } = this.parseEndpoint(httpMethod, endpoint, params);
            const auditData = {
                userId,
                action,
                tableName,
                recordId,
                oldValues: httpMethod === 'PUT' || httpMethod === 'PATCH' ? body : undefined,
                newValues: httpMethod === 'POST' || httpMethod === 'PUT' || httpMethod === 'PATCH' ?
                    (success ? responseData : undefined) : undefined,
                ipAddress,
                userAgent,
                httpMethod,
                endpoint,
                statusCode,
                description: success ?
                    `${action} operation on ${tableName}` :
                    `Failed ${action} operation on ${tableName}: ${error}`,
                duration,
            };
            await this.auditService.createAuditLog(auditData);
        }
        catch (auditError) {
            console.error('Error creating audit log:', auditError);
        }
    }
    parseEndpoint(method, endpoint, params) {
        const segments = endpoint.split('/').filter(s => s);
        if (segments[0] === 'api') {
            segments.shift();
        }
        const tableName = segments[0] || 'unknown';
        let action = 'UNKNOWN';
        let recordId;
        switch (method) {
            case 'POST':
                action = audit_service_1.AuditAction.CREATE;
                break;
            case 'GET':
                action = endpoint.includes('export') ? audit_service_1.AuditAction.EXPORT : audit_service_1.AuditAction.READ;
                break;
            case 'PUT':
            case 'PATCH':
                action = audit_service_1.AuditAction.UPDATE;
                recordId = params?.id || segments[1];
                break;
            case 'DELETE':
                action = audit_service_1.AuditAction.DELETE;
                recordId = params?.id || segments[1];
                break;
        }
        return { action, tableName, recordId };
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map