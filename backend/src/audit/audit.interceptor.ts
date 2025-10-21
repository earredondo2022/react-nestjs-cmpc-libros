import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditService, AuditAction } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Extraer información del request
    const {
      method: httpMethod,
      url: endpoint,
      ip: ipAddress,
      headers,
      user,
      body,
      params,
    } = request;

    const userAgent = headers['user-agent'];
    const userId = (user as any)?.id;

    // Determinar si esta operación debe ser auditada
    if (!this.shouldAudit(httpMethod, endpoint)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((responseData) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Log exitoso
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
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Log con error
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

        throw error; // Re-throw el error
      }),
    );
  }

  private shouldAudit(method: string, endpoint: string): boolean {
    // No auditar operaciones de lectura básicas o endpoints de salud
    const skipPatterns = [
      '/health',
      '/metrics',
      '/favicon.ico',
      '/api/audit', // Evitar recursión
    ];

    // No auditar algunos métodos GET específicos
    const isGetOperation = method === 'GET';
    const isHealthCheck = skipPatterns.some(pattern => endpoint.includes(pattern));

    if (isHealthCheck) {
      return false;
    }

    // Auditar todas las operaciones no-GET y operaciones GET importantes
    if (!isGetOperation) {
      return true;
    }

    // Para GET, solo auditar operaciones específicas importantes
    const importantGetPatterns = [
      '/api/books/export',
      '/api/users',
      '/admin',
    ];

    return importantGetPatterns.some(pattern => endpoint.includes(pattern));
  }

  private async logOperation(operationParams: {
    userId?: string;
    httpMethod: string;
    endpoint: string;
    ipAddress: string;
    userAgent: string;
    statusCode: number;
    duration: number;
    body?: any;
    params?: any;
    responseData?: any;
    error?: string;
    success: boolean;
  }) {
    const {
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
      error,
      success,
    } = operationParams;

    try {
      // Determinar acción y tabla basado en endpoint y método
      const { action, tableName, recordId } = this.parseEndpoint(httpMethod, endpoint, params);

      // Preparar datos para auditoría
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
    } catch (auditError) {
      // No fallar si hay error en auditoría
      console.error('Error creating audit log:', auditError);
    }
  }

  private parseEndpoint(method: string, endpoint: string, params?: any): {
    action: string;
    tableName: string;
    recordId?: string;
  } {
    // Parsear endpoint para determinar tabla y acción
    const segments = endpoint.split('/').filter(s => s);
    
    // Remover 'api' del inicio si existe
    if (segments[0] === 'api') {
      segments.shift();
    }

    const tableName = segments[0] || 'unknown';
    let action = 'UNKNOWN';
    let recordId: string | undefined;

    // Determinar acción basado en método HTTP
    switch (method) {
      case 'POST':
        action = AuditAction.CREATE;
        break;
      case 'GET':
        action = endpoint.includes('export') ? AuditAction.EXPORT : AuditAction.READ;
        break;
      case 'PUT':
      case 'PATCH':
        action = AuditAction.UPDATE;
        recordId = params?.id || segments[1];
        break;
      case 'DELETE':
        action = AuditAction.DELETE;
        recordId = params?.id || segments[1];
        break;
    }

    return { action, tableName, recordId };
  }
}