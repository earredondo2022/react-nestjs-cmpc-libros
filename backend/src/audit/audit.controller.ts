import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Audit')
@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get audit logs with filters' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by user ID' })
  @ApiQuery({ name: 'action', required: false, type: String, description: 'Filter by action' })
  @ApiQuery({ name: 'tableName', required: false, type: String, description: 'Filter by table name' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO string)' })
  @ApiQuery({ name: 'ipAddress', required: false, type: String, description: 'Filter by IP address' })
  async getLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('tableName') tableName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('ipAddress') ipAddress?: string,
  ) {
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

  @Get('stats')
  @ApiOperation({ summary: 'Get audit statistics' })
  @ApiResponse({ status: 200, description: 'Audit statistics retrieved successfully' })
  async getStats() {
    return this.auditService.getAuditStats();
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export audit logs to CSV' })
  @ApiResponse({ status: 200, description: 'CSV file generated successfully' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by user ID' })
  @ApiQuery({ name: 'action', required: false, type: String, description: 'Filter by action' })
  @ApiQuery({ name: 'tableName', required: false, type: String, description: 'Filter by table name' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO string)' })
  async exportToCsv(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('tableName') tableName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ): Promise<void> {
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
      
      // Add BOM for proper UTF-8 encoding in Excel
      res.write('\uFEFF');
      res.end(csvData);
    } catch (error) {
      console.error('Error exporting audit logs to CSV:', error);
      res.status(500).json({ message: 'Error al generar el archivo CSV de auditoría' });
    }
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get audit logs for specific user' })
  @ApiResponse({ status: 200, description: 'User audit logs retrieved successfully' })
  async getUserLogs(@Query('userId') userId: string) {
    return this.auditService.findByUserId(userId);
  }

  @Get('table/:tableName')
  @ApiOperation({ summary: 'Get audit logs for specific table' })
  @ApiResponse({ status: 200, description: 'Table audit logs retrieved successfully' })
  async getTableLogs(@Query('tableName') tableName: string) {
    return this.auditService.findByTableName(tableName);
  }
}