import { Column, Model, Table, DataType } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'audit_logs',
  timestamps: false, // We handle timestamp manually
})
export class AuditLog extends Model<AuditLog> {
  @ApiProperty({
    description: 'Audit log ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'user_id', // Map to snake_case in database
  })
  userId: string;

  @ApiProperty({
    description: 'Action performed',
    example: 'CREATE',
  })
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  action: string;

  @ApiProperty({
    description: 'Table name affected',
    example: 'books',
  })
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'table_name', // Map to snake_case in database
  })
  tableName: string;

  @ApiProperty({
    description: 'Record ID affected',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'record_id', // Map to snake_case in database
  })
  recordId: string;

  @ApiProperty({
    description: 'Old values before change',
    example: '{"title": "Old Title"}',
    required: false,
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
    field: 'old_values', // Map to snake_case in database
  })
  oldValues: object;

  @ApiProperty({
    description: 'New values after change',
    example: '{"title": "New Title"}',
    required: false,
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
    field: 'new_values', // Map to snake_case in database
  })
  newValues: object;

  @ApiProperty({
    description: 'IP address of the user',
    example: '192.168.1.1',
    required: false,
  })
  @Column({
    type: DataType.INET,
    allowNull: true,
    field: 'ip_address', // Map to snake_case in database
  })
  ipAddress: string;

  @ApiProperty({
    description: 'User agent string',
    example: 'Mozilla/5.0...',
    required: false,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'user_agent', // Map to snake_case in database
  })
  userAgent: string;

  @ApiProperty({
    description: 'Audit log creation date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
    field: 'created_at', // Map to snake_case in database
  })
  createdAt: Date;
}