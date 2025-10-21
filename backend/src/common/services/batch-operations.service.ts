import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Book } from '../../books/entities/book.entity';
import { Author } from '../../authors/entities/author.entity';
import { Publisher } from '../../publishers/entities/publisher.entity';
import { Genre } from '../../genres/entities/genre.entity';
import { TransactionService } from './transaction.service';
import { AuditService } from '../../audit/audit.service';
import { Readable } from 'stream';

export interface BatchBookData {
  title: string;
  isbn?: string;
  price: number;
  stockQuantity?: number;
  isAvailable?: boolean;
  publicationDate?: string;
  pages?: number;
  description?: string;
  imageUrl?: string;
  authorName?: string;
  publisherName?: string;
  genreName?: string;
}

export interface BatchOperationResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  created?: string[];
  updated?: string[];
  deleted?: string[];
}

export interface BatchOperationOptions {
  batchSize?: number;
  continueOnError?: boolean;
  validateOnly?: boolean;
  updateExisting?: boolean;
  auditContext?: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

@Injectable()
export class BatchOperationsService {
  private readonly logger = new Logger(BatchOperationsService.name);
  private readonly DEFAULT_BATCH_SIZE = 100;

  constructor(
    @InjectModel(Book)
    private bookModel: typeof Book,
    @InjectModel(Author)
    private authorModel: typeof Author,
    @InjectModel(Publisher)
    private publisherModel: typeof Publisher,
    @InjectModel(Genre)
    private genreModel: typeof Genre,
    private transactionService: TransactionService,
    private auditService: AuditService,
  ) {}

  /**
   * Import books from CSV data with full transaction support
   */
  async importBooksFromCsv(
    csvData: string,
    options: BatchOperationOptions = {}
  ): Promise<BatchOperationResult> {
    const {
      batchSize = this.DEFAULT_BATCH_SIZE,
      continueOnError = false,
      validateOnly = false,
      updateExisting = false,
      auditContext,
    } = options;

    this.logger.log(`Starting CSV import. Validate only: ${validateOnly}, Update existing: ${updateExisting}`);

    return await this.transactionService.runInTransaction(async (transaction) => {
      const result: BatchOperationResult = {
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        errors: [],
        created: [],
        updated: [],
      };

      try {
        // Parse CSV data
        const books = await this.parseCsvData(csvData);
        result.totalProcessed = books.length;

        // Process books in batches
        for (let i = 0; i < books.length; i += batchSize) {
          const batch = books.slice(i, i + batchSize);
          
          const batchResult = await this.processBooksInBatch(
            batch,
            i,
            { validateOnly, updateExisting, auditContext },
            transaction
          );

          result.successful += batchResult.successful;
          result.failed += batchResult.failed;
          result.errors.push(...batchResult.errors);
          result.created?.push(...(batchResult.created || []));
          result.updated?.push(...(batchResult.updated || []));

          if (!continueOnError && batchResult.failed > 0) {
            throw new BadRequestException(`Batch operation failed at batch starting at row ${i + 1}`);
          }

          this.logger.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(books.length / batchSize)}`);
        }

        // Log overall operation audit
        if (auditContext && !validateOnly) {
          await this.auditService.logCreateWithTransaction({
            userId: auditContext.userId,
            tableName: 'books',
            recordId: 'batch_import',
            newValues: {
              operation: 'csv_import',
              totalProcessed: result.totalProcessed,
              successful: result.successful,
              failed: result.failed,
              updateExisting,
            },
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
            description: `Importación masiva CSV: ${result.successful} exitosos, ${result.failed} fallidos de ${result.totalProcessed} total`,
          }, transaction);
        }

        this.logger.log(`CSV import completed: ${result.successful} successful, ${result.failed} failed`);
        return result;

      } catch (error) {
        this.logger.error('CSV import failed:', error);
        throw error;
      }
    });
  }

  /**
   * Bulk update books with transaction support
   */
  async bulkUpdateBooks(
    updates: Array<{ id: string; updates: Partial<Book> }>,
    options: BatchOperationOptions = {}
  ): Promise<BatchOperationResult> {
    const {
      batchSize = this.DEFAULT_BATCH_SIZE,
      continueOnError = false,
      auditContext,
    } = options;

    return await this.transactionService.runInTransaction(async (transaction) => {
      const result: BatchOperationResult = {
        totalProcessed: updates.length,
        successful: 0,
        failed: 0,
        errors: [],
        updated: [],
      };

      try {
        // Process updates in batches
        for (let i = 0; i < updates.length; i += batchSize) {
          const batch = updates.slice(i, i + batchSize);

          for (const [index, { id, updates: updateData }] of batch.entries()) {
            try {
              // Get current book for audit
              const oldBook = await this.bookModel.findByPk(id, { transaction });
              if (!oldBook) {
                result.errors.push({
                  row: i + index + 1,
                  data: { id, ...updateData },
                  error: `Book with ID ${id} not found`
                });
                result.failed++;
                continue;
              }

              // Update book
              await this.bookModel.update(updateData, {
                where: { id },
                transaction,
              });

              // Get updated book
              const updatedBook = await this.bookModel.findByPk(id, { transaction });

              // Audit log
              if (auditContext) {
                await this.auditService.logUpdateWithTransaction({
                  userId: auditContext.userId,
                  tableName: 'books',
                  recordId: id,
                  oldValues: oldBook.toJSON(),
                  newValues: updatedBook.toJSON(),
                  ipAddress: auditContext.ipAddress,
                  userAgent: auditContext.userAgent,
                  description: `Actualización masiva de libro: "${updatedBook.title}"`,
                }, transaction);
              }

              result.successful++;
              result.updated?.push(id);

            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Unknown error';
              result.errors.push({
                row: i + index + 1,
                data: { id, ...updateData },
                error: errorMsg
              });
              result.failed++;

              if (!continueOnError) {
                throw error;
              }
            }
          }

          this.logger.log(`Processed update batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(updates.length / batchSize)}`);
        }

        return result;

      } catch (error) {
        this.logger.error('Bulk update failed:', error);
        throw error;
      }
    });
  }

  /**
   * Bulk delete books with transaction support
   */
  async bulkDeleteBooks(
    bookIds: string[],
    options: BatchOperationOptions = {}
  ): Promise<BatchOperationResult> {
    const {
      batchSize = this.DEFAULT_BATCH_SIZE,
      continueOnError = false,
      auditContext,
    } = options;

    return await this.transactionService.runInTransaction(async (transaction) => {
      const result: BatchOperationResult = {
        totalProcessed: bookIds.length,
        successful: 0,
        failed: 0,
        errors: [],
        deleted: [],
      };

      try {
        // Process deletions in batches
        for (let i = 0; i < bookIds.length; i += batchSize) {
          const batch = bookIds.slice(i, i + batchSize);

          for (const [index, bookId] of batch.entries()) {
            try {
              // Get book data for audit before deletion
              const bookToDelete = await this.bookModel.findByPk(bookId, { transaction });
              if (!bookToDelete) {
                result.errors.push({
                  row: i + index + 1,
                  data: { id: bookId },
                  error: `Book with ID ${bookId} not found`
                });
                result.failed++;
                continue;
              }

              // Delete book
              const deletedCount = await this.bookModel.destroy({
                where: { id: bookId },
                transaction,
              });

              if (deletedCount === 0) {
                result.errors.push({
                  row: i + index + 1,
                  data: { id: bookId },
                  error: `Failed to delete book with ID ${bookId}`
                });
                result.failed++;
                continue;
              }

              // Audit log
              if (auditContext) {
                await this.auditService.logDeleteWithTransaction({
                  userId: auditContext.userId,
                  tableName: 'books',
                  recordId: bookId,
                  oldValues: bookToDelete.toJSON(),
                  ipAddress: auditContext.ipAddress,
                  userAgent: auditContext.userAgent,
                  description: `Eliminación masiva de libro: "${bookToDelete.title}"`,
                }, transaction);
              }

              result.successful++;
              result.deleted?.push(bookId);

            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Unknown error';
              result.errors.push({
                row: i + index + 1,
                data: { id: bookId },
                error: errorMsg
              });
              result.failed++;

              if (!continueOnError) {
                throw error;
              }
            }
          }

          this.logger.log(`Processed delete batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(bookIds.length / batchSize)}`);
        }

        return result;

      } catch (error) {
        this.logger.error('Bulk delete failed:', error);
        throw error;
      }
    });
  }

  /**
   * Process books in parallel with transaction support
   */
  async processMultipleOperations(
    operations: Array<{
      type: 'create' | 'update' | 'delete';
      data: any;
    }>,
    options: BatchOperationOptions = {}
  ): Promise<BatchOperationResult> {
    return await this.transactionService.runInParallelTransaction(
      operations.map(op => async (transaction) => {
        switch (op.type) {
          case 'create':
            return await this.bookModel.create(op.data, { transaction });
          case 'update':
            return await this.bookModel.update(op.data.updates, {
              where: { id: op.data.id },
              transaction
            });
          case 'delete':
            return await this.bookModel.destroy({
              where: { id: op.data.id },
              transaction
            });
          default:
            throw new Error(`Unknown operation type: ${op.type}`);
        }
      })
    ).then(results => ({
      totalProcessed: operations.length,
      successful: results.filter(r => r !== null).length,
      failed: results.filter(r => r === null).length,
      errors: [],
    }));
  }

  /**
   * Private method to parse CSV data
   */
  private async parseCsvData(csvData: string): Promise<BatchBookData[]> {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new BadRequestException('CSV must have at least header and one data row');
    }

    // Parse header
    const header = lines[0].split(',').map(col => col.trim().replace(/"/g, ''));
    const books: BatchBookData[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCsvRow(lines[i]);
      const rowData: { [key: string]: string } = {};

      // Map columns to data
      header.forEach((col, index) => {
        rowData[col] = row[index] || '';
      });

      // Convert CSV row to BatchBookData
      const book: BatchBookData = {
        title: rowData['título'] || rowData['title'] || '',
        isbn: rowData['isbn'] || rowData['ISBN'] || '',
        price: parseFloat(rowData['precio'] || rowData['price'] || '0'),
        stockQuantity: parseInt(rowData['stock'] || rowData['stockQuantity'] || '0'),
        isAvailable: (rowData['disponible'] || rowData['isAvailable'] || 'true').toLowerCase() === 'true',
        publicationDate: rowData['fecha_publicacion'] || rowData['publicationDate'] || '',
        pages: parseInt(rowData['paginas'] || rowData['pages'] || '0') || undefined,
        description: rowData['descripcion'] || rowData['description'] || '',
        imageUrl: rowData['imagen'] || rowData['imageUrl'] || '',
        authorName: rowData['autor'] || rowData['author'] || '',
        publisherName: rowData['editorial'] || rowData['publisher'] || '',
        genreName: rowData['genero'] || rowData['genre'] || '',
      };

      books.push(book);
    }

    return books;
  }

  /**
   * Parse a single CSV row handling quoted values
   */
  private parseCsvRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      const nextChar = i < row.length - 1 ? row[i + 1] : '';

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add the last field
    result.push(current.trim());
    return result;
  }

  /**
   * Private method to process a batch of books
   */
  private async processBooksInBatch(
    books: BatchBookData[],
    startIndex: number,
    options: {
      validateOnly?: boolean;
      updateExisting?: boolean;
      auditContext?: { userId?: string; ipAddress?: string; userAgent?: string };
    },
    transaction: any
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      totalProcessed: books.length,
      successful: 0,
      failed: 0,
      errors: [],
      created: [],
      updated: [],
    };

    for (const [index, bookData] of books.entries()) {
      try {
        // Validate required fields
        if (!bookData.title || bookData.price <= 0) {
          result.errors.push({
            row: startIndex + index + 1,
            data: bookData,
            error: 'Title is required and price must be greater than 0'
          });
          result.failed++;
          continue;
        }

        if (options.validateOnly) {
          result.successful++;
          continue;
        }

        // Find or create related entities
        const authorId = bookData.authorName ? 
          await this.findOrCreateAuthor(bookData.authorName, transaction) : null;
        const publisherId = bookData.publisherName ? 
          await this.findOrCreatePublisher(bookData.publisherName, transaction) : null;
        const genreId = bookData.genreName ? 
          await this.findOrCreateGenre(bookData.genreName, transaction) : null;

        // Prepare book creation data
        const createData = {
          title: bookData.title,
          isbn: bookData.isbn || null,
          price: bookData.price,
          stockQuantity: bookData.stockQuantity || 0,
          isAvailable: bookData.isAvailable !== false,
          publicationDate: bookData.publicationDate ? new Date(bookData.publicationDate) : null,
          pages: bookData.pages || null,
          description: bookData.description || null,
          imageUrl: bookData.imageUrl || null,
          authorId,
          publisherId,
          genreId,
        };

        let book: Book;
        let operation: 'created' | 'updated' = 'created';

        // Check if book exists (by ISBN or title)
        const existingBook = await this.bookModel.findOne({
          where: bookData.isbn ? { isbn: bookData.isbn } : { title: bookData.title },
          transaction,
        });

        if (existingBook && options.updateExisting) {
          // Update existing book
          await this.bookModel.update(createData, {
            where: { id: existingBook.id },
            transaction,
          });
          book = await this.bookModel.findByPk(existingBook.id, { transaction });
          operation = 'updated';
          result.updated?.push(book.id);
        } else if (!existingBook) {
          // Create new book
          book = await this.bookModel.create(createData, { transaction });
          result.created?.push(book.id);
        } else {
          result.errors.push({
            row: startIndex + index + 1,
            data: bookData,
            error: 'Book already exists and updateExisting is false'
          });
          result.failed++;
          continue;
        }

        // Audit log
        if (options.auditContext) {
          const auditMethod = operation === 'created' ? 
            this.auditService.logCreateWithTransaction : 
            this.auditService.logUpdateWithTransaction;

          const auditData = operation === 'created' ? {
            userId: options.auditContext.userId,
            tableName: 'books',
            recordId: book.id,
            newValues: book.toJSON(),
            ipAddress: options.auditContext.ipAddress,
            userAgent: options.auditContext.userAgent,
            description: `Libro ${operation} en importación masiva: "${book.title}"`,
          } : {
            userId: options.auditContext.userId,
            tableName: 'books',
            recordId: book.id,
            oldValues: existingBook?.toJSON(),
            newValues: book.toJSON(),
            ipAddress: options.auditContext.ipAddress,
            userAgent: options.auditContext.userAgent,
            description: `Libro ${operation} en importación masiva: "${book.title}"`,
          };

          await auditMethod.call(this.auditService, auditData, transaction);
        }

        result.successful++;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push({
          row: startIndex + index + 1,
          data: bookData,
          error: errorMsg
        });
        result.failed++;
      }
    }

    return result;
  }

  /**
   * Find or create author
   */
  private async findOrCreateAuthor(name: string, transaction: any): Promise<string> {
    let author = await this.authorModel.findOne({
      where: { name },
      transaction,
    });

    if (!author) {
      author = await this.authorModel.create({ name }, { transaction });
    }

    return author.id;
  }

  /**
   * Find or create publisher
   */
  private async findOrCreatePublisher(name: string, transaction: any): Promise<string> {
    let publisher = await this.publisherModel.findOne({
      where: { name },
      transaction,
    });

    if (!publisher) {
      publisher = await this.publisherModel.create({ name }, { transaction });
    }

    return publisher.id;
  }

  /**
   * Find or create genre
   */
  private async findOrCreateGenre(name: string, transaction: any): Promise<string> {
    let genre = await this.genreModel.findOne({
      where: { name },
      transaction,
    });

    if (!genre) {
      genre = await this.genreModel.create({ name }, { transaction });
    }

    return genre.id;
  }
}