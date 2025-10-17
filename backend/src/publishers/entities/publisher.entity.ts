import { Column, Model, Table, DataType, HasMany } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { Book } from '../../books/entities/book.entity';

@Table({
  tableName: 'publishers',
  timestamps: true,
  paranoid: true, // Enable soft deletes
})
export class Publisher extends Model<Publisher> {
  @ApiProperty({
    description: 'Publisher ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ApiProperty({
    description: 'Publisher name',
    example: 'Penguin Random House',
  })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @ApiProperty({
    description: 'Publisher country',
    example: 'United States',
    required: false,
  })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  country: string;

  @ApiProperty({
    description: 'Publisher founded year',
    example: 1927,
    required: false,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'founded_year',
  })
  foundedYear: number;

  @ApiProperty({
    description: 'Publisher creation date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
    field: 'created_at',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Publisher last update date',
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