import { Column, Model, Table, DataType, HasMany } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { Book } from '../../books/entities/book.entity';

@Table({
  tableName: 'authors',
  timestamps: true,
  paranoid: true, // Enable soft deletes
})
export class Author extends Model<Author> {
  @ApiProperty({
    description: 'Author ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ApiProperty({
    description: 'Author name',
    example: 'Gabriel García Márquez',
  })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @ApiProperty({
    description: 'Author biography',
    example: 'Colombian novelist and Nobel Prize winner...',
    required: false,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  biography: string;

  @ApiProperty({
    description: 'Author birth date',
    example: '1927-03-06',
    required: false,
  })
  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
    field: 'birth_date',
  })
  birthDate: Date;

  @ApiProperty({
    description: 'Author nationality',
    example: 'Colombian',
    required: false,
  })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  nationality: string;

  @ApiProperty({
    description: 'Author creation date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
    field: 'created_at',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Author last update date',
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