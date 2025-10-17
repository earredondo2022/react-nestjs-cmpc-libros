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
  })
  tableName: string;

  @ApiProperty({
    description: 'Record ID affected',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    type: DataType.UUID,
    allowNull: true,
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
  })
  userAgent: string;

  @ApiProperty({
    description: 'Audit log creation date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  createdAt: Date;
}