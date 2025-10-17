import { Column, Model, Table, DataType, HasMany } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { Book } from '../../books/entities/book.entity';

@Table({
  tableName: 'genres',
  timestamps: true,
  paranoid: true, // Enable soft deletes
})
export class Genre extends Model<Genre> {
  @ApiProperty({
    description: 'Genre ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ApiProperty({
    description: 'Genre name',
    example: 'Fiction',
  })
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  name: string;

  @ApiProperty({
    description: 'Genre description',
    example: 'Imaginative narratives and stories',
    required: false,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @ApiProperty({
    description: 'Genre creation date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
    field: 'created_at',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Genre last update date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
    field: 'updated_at',
  })
  updatedAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'deleted_at',
  })
  deletedAt: Date;

  // Associations
  @HasMany(() => Book)
  books: Book[];
}