import { Column, Model, Table, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { Author } from '../../authors/entities/author.entity';
import { Publisher } from '../../publishers/entities/publisher.entity';
import { Genre } from '../../genres/entities/genre.entity';

@Table({
  tableName: 'books',
  timestamps: true,
  paranoid: true, // Enable soft deletes
})
export class Book extends Model<Book> {
  @ApiProperty({
    description: 'Book ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ApiProperty({
    description: 'Book title',
    example: 'One Hundred Years of Solitude',
  })
  @Column({
    type: DataType.STRING(500),
    allowNull: false,
  })
  title: string;

  @ApiProperty({
    description: 'Book ISBN',
    example: '978-0060883287',
    required: false,
  })
  @Column({
    type: DataType.STRING(17),
    allowNull: true,
    unique: true,
  })
  isbn: string;

  @ApiProperty({
    description: 'Book price',
    example: 29.99,
  })
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  })
  price: number;

  @ApiProperty({
    description: 'Stock quantity',
    example: 50,
  })
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'stock_quantity',
    validate: {
      min: 0,
    },
  })
  stockQuantity: number;

  @ApiProperty({
    description: 'Book availability',
    example: true,
  })
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    field: 'is_available',
  })
  isAvailable: boolean;

  @ApiProperty({
    description: 'Publication date',
    example: '1967-05-30',
    required: false,
  })
  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
    field: 'publication_date',
  })
  publicationDate: Date;

  @ApiProperty({
    description: 'Number of pages',
    example: 417,
    required: false,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  pages: number;

  @ApiProperty({
    description: 'Book description',
    example: 'A landmark novel that tells the story of the Buendía family...',
    required: false,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @ApiProperty({
    description: 'Book cover image URL',
    example: '/uploads/book-cover-123.jpg',
    required: false,
  })
  @Column({
    type: DataType.STRING(500),
    allowNull: true,
    field: 'image_url',
  })
  imageUrl: string;

  // Foreign Keys
  @ForeignKey(() => Author)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'author_id',
  })
  authorId: string;

  @ForeignKey(() => Publisher)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'publisher_id',
  })
  publisherId: string;

  @ForeignKey(() => Genre)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'genre_id',
  })
  genreId: string;

  @ApiProperty({
    description: 'Book creation date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
    field: 'created_at',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Book last update date',
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
  @BelongsTo(() => Author)
  author: Author;

  @BelongsTo(() => Publisher)
  publisher: Publisher;

  @BelongsTo(() => Genre)
  genre: Genre;

  // Computed properties
  get availability(): string {
    if (!this.isAvailable) return 'No disponible';
    if (this.stockQuantity === 0) return 'Agotado';
    if (this.stockQuantity <= 5) return 'Pocas unidades';
    return 'Disponible';
  }
}