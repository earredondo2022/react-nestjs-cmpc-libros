import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Book } from './entities/book.entity';
import { Author } from '../authors/entities/author.entity';
import { Publisher } from '../publishers/entities/publisher.entity';
import { Genre } from '../genres/entities/genre.entity';
import { AuditService } from '../audit/audit.service';
import { TransactionService } from '../common/services/transaction.service';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book)
    private bookModel: typeof Book,
    private auditService: AuditService,
    private transactionService: TransactionService,
  ) {}

  async create(
    bookData: {
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
    },
    auditContext?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<Book> {
    return await this.transactionService.runInTransaction(async (transaction) => {
      // Create the book within the transaction
      const newBook = await this.bookModel.create(bookData, { transaction });

      // Register audit within the same transaction
      if (auditContext) {
        await this.auditService.logCreateWithTransaction({
          userId: auditContext.userId,
          tableName: 'books',
          recordId: newBook.id,
          newValues: newBook.toJSON(),
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          description: `Libro creado: "${newBook.title}"`,
        }, transaction);
      }

      return newBook;
    });
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

  async update(
    id: string, 
    bookData: Partial<Book>,
    auditContext?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<Book | null> {
    return await this.transactionService.runInTransaction(async (transaction) => {
      // Obtener datos anteriores para auditoría
      const oldBook = auditContext ? await this.findById(id) : null;

      const [updatedRowsCount] = await this.bookModel.update(bookData, {
        where: { id },
        transaction,
      });

      if (updatedRowsCount === 0) {
        return null;
      }

      const updatedBook = await this.bookModel.findByPk(id, {
        include: [
          { model: Author, attributes: ['id', 'name'] },
          { model: Publisher, attributes: ['id', 'name'] },
          { model: Genre, attributes: ['id', 'name'] }
        ],
        transaction,
      });

      // Registrar auditoría
      if (auditContext && oldBook && updatedBook) {
        await this.auditService.logUpdateWithTransaction({
          userId: auditContext.userId,
          tableName: 'books',
          recordId: id,
          oldValues: oldBook.toJSON(),
          newValues: updatedBook.toJSON(),
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          description: `Libro actualizado: "${updatedBook.title}"`,
        }, transaction);
      }

      return updatedBook;
    });
  }

  async remove(
    id: string,
    auditContext?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<boolean> {
    return await this.transactionService.runInTransaction(async (transaction) => {
      // Obtener datos del libro antes de eliminarlo para auditoría
      const bookToDelete = auditContext ? await this.findById(id) : null;

      const deletedRowsCount = await this.bookModel.destroy({
        where: { id },
        transaction,
      });

      const wasDeleted = deletedRowsCount > 0;

      // Registrar auditoría
      if (auditContext && bookToDelete && wasDeleted) {
        await this.auditService.logDeleteWithTransaction({
          userId: auditContext.userId,
          tableName: 'books',
          recordId: id,
          oldValues: bookToDelete.toJSON(),
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          description: `Libro eliminado: "${bookToDelete.title}"`,
        }, transaction);
      }

      return wasDeleted;
    });
  }

  async exportToCsv(
    filters?: {
      title?: string;
      authorId?: string;
      publisherId?: string;
      genreId?: string;
      isAvailable?: string;
    },
    auditContext?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<string> {
    const where: any = {};

    // Apply same filters as findAll method
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
      const isAvailableValue = filters.isAvailable === 'true';
      where.is_available = isAvailableValue;
    }

    // Get all books without pagination for export
    const books = await this.bookModel.findAll({
      where,
      order: [['title', 'ASC']],
      include: [
        { model: Author, attributes: ['id', 'name'] },
        { model: Publisher, attributes: ['id', 'name'] },
        { model: Genre, attributes: ['id', 'name'] }
      ]
    });

    // Define CSV headers in Spanish
    const headers = [
      'ID',
      'Título',
      'ISBN',
      'Autor',
      'Editorial',
      'Género',
      'Precio',
      'Stock',
      'Disponible',
      'Fecha Publicación',
      'Páginas',
      'Descripción',
      'Imagen URL',
      'Fecha Creación',
      'Última Actualización'
    ];

    // Helper function to escape CSV values
    const escapeCsvValue = (value: any): string => {
      if (value === null || value === undefined) {
        return '';
      }
      
      const stringValue = String(value);
      
      // If the value contains comma, newline, or double quote, wrap in quotes and escape quotes
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    };

    // Helper function to format date
    const formatDate = (date: string | Date): string => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('es-ES');
    };

    // Helper function to safely format price
    const formatPrice = (price: any): string => {
      if (price === null || price === undefined || price === '') {
        return '0.00';
      }
      
      const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
      
      if (isNaN(numPrice)) {
        return '0.00';
      }
      
      return numPrice.toFixed(2);
    };

    // Convert books to CSV rows
    const csvRows = books.map(book => [
      escapeCsvValue(book.id),
      escapeCsvValue(book.title),
      escapeCsvValue(book.isbn || ''),
      escapeCsvValue((book as any).author?.name || ''),
      escapeCsvValue((book as any).publisher?.name || ''),
      escapeCsvValue((book as any).genre?.name || ''),
      escapeCsvValue(formatPrice(book.price)),
      escapeCsvValue(book.stockQuantity || 0),
      escapeCsvValue(book.isAvailable ? 'Sí' : 'No'),
      escapeCsvValue(book.publicationDate ? formatDate(book.publicationDate) : ''),
      escapeCsvValue(book.pages || ''),
      escapeCsvValue(book.description || ''),
      escapeCsvValue(book.imageUrl || ''),
      escapeCsvValue(formatDate(book.createdAt)),
      escapeCsvValue(formatDate(book.updatedAt))
    ].join(','));

    // Combine headers and rows
    const csvContent = [headers.join(','), ...csvRows].join('\n');

    // Registrar auditoría de exportación
    if (auditContext) {
      await this.auditService.logExport({
        userId: auditContext.userId,
        tableName: 'books',
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        description: `Exportación CSV de ${books.length} libros con filtros: ${JSON.stringify(filters || {})}`,
      });
    }
    
    return csvContent;
  }
}