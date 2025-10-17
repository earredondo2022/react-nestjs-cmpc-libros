import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Book } from './entities/book.entity';
import { Author } from '../authors/entities/author.entity';
import { Publisher } from '../publishers/entities/publisher.entity';
import { Genre } from '../genres/entities/genre.entity';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book)
    private bookModel: typeof Book,
  ) {}

  async create(bookData: {
    title: string;
    isbn?: string;
    price: number;
    stockQuantity?: number;
    isAvailable?: boolean;
    publicationDate?: Date;
    pages?: number;
    description?: string;
    imageUrl?: string;
    authorId?: string;
    publisherId?: string;
    genreId?: string;
  }): Promise<Book> {
    return this.bookModel.create(bookData);
  }

  async findAll(
    page: number = 1, 
    limit: number = 10, 
    filters?: {
      title?: string;
      authorId?: string;
      publisherId?: string;
      genreId?: string;
      isAvailable?: boolean | string;
    },
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Promise<{ books: Book[]; total: number }> {
    const offset = (page - 1) * limit;
    const where: any = {};

    // Apply filters
    if (filters?.title) {
      where.title = { [Op.iLike]: `%${filters.title}%` };
    }
    if (filters?.authorId) {
      where.author_id = filters.authorId;
    }
    if (filters?.publisherId) {
      where.publisher_id = filters.publisherId;
    }
    if (filters?.genreId) {
      where.genre_id = filters.genreId;
    }
    if (filters?.isAvailable !== undefined) {
      const isAvailableValue = typeof filters.isAvailable === 'string' 
        ? filters.isAvailable === 'true' 
        : filters.isAvailable;
      where.is_available = isAvailableValue;
    }

    // Map frontend field names to database column names for sorting
    const fieldMap: { [key: string]: string } = {
      'title': 'title',
      'authorId': 'author_id',
      'publisherId': 'publisher_id', 
      'genreId': 'genre_id',
      'price': 'price',
      'stockQuantity': 'stock_quantity',
      'isAvailable': 'is_available',
      'createdAt': 'created_at'
    };

    const orderField = fieldMap[sortBy] || 'created_at';

    const { rows: books, count: total } = await this.bookModel.findAndCountAll({
      where,
      offset,
      limit,
      order: [[orderField, sortOrder]],
      include: [
        { model: Author, attributes: ['id', 'name'] },
        { model: Publisher, attributes: ['id', 'name'] },
        { model: Genre, attributes: ['id', 'name'] }
      ]
    });

    return { books, total };
  }

  async findById(id: string): Promise<Book | null> {
    return this.bookModel.findByPk(id, {
      include: [
        { model: Author, attributes: ['id', 'name'] },
        { model: Publisher, attributes: ['id', 'name'] },
        { model: Genre, attributes: ['id', 'name'] }
      ]
    });
  }

  async update(id: string, bookData: Partial<Book>): Promise<Book | null> {
    const [updatedRowsCount] = await this.bookModel.update(bookData, {
      where: { id },
    });

    if (updatedRowsCount === 0) {
      return null;
    }

    return this.findById(id);
  }

  async remove(id: string): Promise<boolean> {
    const deletedRowsCount = await this.bookModel.destroy({
      where: { id },
    });

    return deletedRowsCount > 0;
  }
}