"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BatchOperationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchOperationsService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const book_entity_1 = require("../../books/entities/book.entity");
const author_entity_1 = require("../../authors/entities/author.entity");
const publisher_entity_1 = require("../../publishers/entities/publisher.entity");
const genre_entity_1 = require("../../genres/entities/genre.entity");
const transaction_service_1 = require("./transaction.service");
const audit_service_1 = require("../../audit/audit.service");
let BatchOperationsService = BatchOperationsService_1 = class BatchOperationsService {
    constructor(bookModel, authorModel, publisherModel, genreModel, transactionService, auditService) {
        this.bookModel = bookModel;
        this.authorModel = authorModel;
        this.publisherModel = publisherModel;
        this.genreModel = genreModel;
        this.transactionService = transactionService;
        this.auditService = auditService;
        this.logger = new common_1.Logger(BatchOperationsService_1.name);
        this.DEFAULT_BATCH_SIZE = 100;
    }
    async importBooksFromCsv(csvData, options = {}) {
        const { batchSize = this.DEFAULT_BATCH_SIZE, continueOnError = false, validateOnly = false, updateExisting = false, auditContext, } = options;
        this.logger.log(`Starting CSV import. Validate only: ${validateOnly}, Update existing: ${updateExisting}`);
        return await this.transactionService.runInTransaction(async (transaction) => {
            var _a, _b;
            const result = {
                totalProcessed: 0,
                successful: 0,
                failed: 0,
                errors: [],
                created: [],
                updated: [],
            };
            try {
                const books = await this.parseCsvData(csvData);
                result.totalProcessed = books.length;
                for (let i = 0; i < books.length; i += batchSize) {
                    const batch = books.slice(i, i + batchSize);
                    const batchResult = await this.processBooksInBatch(batch, i, { validateOnly, updateExisting, auditContext }, transaction);
                    result.successful += batchResult.successful;
                    result.failed += batchResult.failed;
                    result.errors.push(...batchResult.errors);
                    (_a = result.created) === null || _a === void 0 ? void 0 : _a.push(...(batchResult.created || []));
                    (_b = result.updated) === null || _b === void 0 ? void 0 : _b.push(...(batchResult.updated || []));
                    if (!continueOnError && batchResult.failed > 0) {
                        throw new common_1.BadRequestException(`Batch operation failed at batch starting at row ${i + 1}`);
                    }
                    this.logger.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(books.length / batchSize)}`);
                }
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
            }
            catch (error) {
                this.logger.error('CSV import failed:', error);
                throw error;
            }
        });
    }
    async bulkUpdateBooks(updates, options = {}) {
        const { batchSize = this.DEFAULT_BATCH_SIZE, continueOnError = false, auditContext, } = options;
        return await this.transactionService.runInTransaction(async (transaction) => {
            var _a;
            const result = {
                totalProcessed: updates.length,
                successful: 0,
                failed: 0,
                errors: [],
                updated: [],
            };
            try {
                for (let i = 0; i < updates.length; i += batchSize) {
                    const batch = updates.slice(i, i + batchSize);
                    for (const [index, { id, updates: updateData }] of batch.entries()) {
                        try {
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
                            await this.bookModel.update(updateData, {
                                where: { id },
                                transaction,
                            });
                            const updatedBook = await this.bookModel.findByPk(id, { transaction });
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
                            (_a = result.updated) === null || _a === void 0 ? void 0 : _a.push(id);
                        }
                        catch (error) {
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
            }
            catch (error) {
                this.logger.error('Bulk update failed:', error);
                throw error;
            }
        });
    }
    async bulkDeleteBooks(bookIds, options = {}) {
        const { batchSize = this.DEFAULT_BATCH_SIZE, continueOnError = false, auditContext, } = options;
        return await this.transactionService.runInTransaction(async (transaction) => {
            var _a;
            const result = {
                totalProcessed: bookIds.length,
                successful: 0,
                failed: 0,
                errors: [],
                deleted: [],
            };
            try {
                for (let i = 0; i < bookIds.length; i += batchSize) {
                    const batch = bookIds.slice(i, i + batchSize);
                    for (const [index, bookId] of batch.entries()) {
                        try {
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
                            (_a = result.deleted) === null || _a === void 0 ? void 0 : _a.push(bookId);
                        }
                        catch (error) {
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
            }
            catch (error) {
                this.logger.error('Bulk delete failed:', error);
                throw error;
            }
        });
    }
    async processMultipleOperations(operations, options = {}) {
        return await this.transactionService.runInParallelTransaction(operations.map(op => async (transaction) => {
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
        })).then(results => ({
            totalProcessed: operations.length,
            successful: results.filter(r => r !== null).length,
            failed: results.filter(r => r === null).length,
            errors: [],
        }));
    }
    async parseCsvData(csvData) {
        const lines = csvData.trim().split('\n');
        if (lines.length < 2) {
            throw new common_1.BadRequestException('CSV must have at least header and one data row');
        }
        const header = lines[0].split(',').map(col => col.trim().replace(/"/g, ''));
        const books = [];
        for (let i = 1; i < lines.length; i++) {
            const row = this.parseCsvRow(lines[i]);
            const rowData = {};
            header.forEach((col, index) => {
                rowData[col] = row[index] || '';
            });
            const book = {
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
    parseCsvRow(row) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            const nextChar = i < row.length - 1 ? row[i + 1] : '';
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++;
                }
                else {
                    inQuotes = !inQuotes;
                }
            }
            else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            }
            else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }
    async processBooksInBatch(books, startIndex, options, transaction) {
        var _a, _b;
        const result = {
            totalProcessed: books.length,
            successful: 0,
            failed: 0,
            errors: [],
            created: [],
            updated: [],
        };
        for (const [index, bookData] of books.entries()) {
            try {
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
                const authorId = bookData.authorName ?
                    await this.findOrCreateAuthor(bookData.authorName, transaction) : null;
                const publisherId = bookData.publisherName ?
                    await this.findOrCreatePublisher(bookData.publisherName, transaction) : null;
                const genreId = bookData.genreName ?
                    await this.findOrCreateGenre(bookData.genreName, transaction) : null;
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
                let book;
                let operation = 'created';
                const existingBook = await this.bookModel.findOne({
                    where: bookData.isbn ? { isbn: bookData.isbn } : { title: bookData.title },
                    transaction,
                });
                if (existingBook && options.updateExisting) {
                    await this.bookModel.update(createData, {
                        where: { id: existingBook.id },
                        transaction,
                    });
                    book = await this.bookModel.findByPk(existingBook.id, { transaction });
                    operation = 'updated';
                    (_a = result.updated) === null || _a === void 0 ? void 0 : _a.push(book.id);
                }
                else if (!existingBook) {
                    book = await this.bookModel.create(createData, { transaction });
                    (_b = result.created) === null || _b === void 0 ? void 0 : _b.push(book.id);
                }
                else {
                    result.errors.push({
                        row: startIndex + index + 1,
                        data: bookData,
                        error: 'Book already exists and updateExisting is false'
                    });
                    result.failed++;
                    continue;
                }
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
                        oldValues: existingBook === null || existingBook === void 0 ? void 0 : existingBook.toJSON(),
                        newValues: book.toJSON(),
                        ipAddress: options.auditContext.ipAddress,
                        userAgent: options.auditContext.userAgent,
                        description: `Libro ${operation} en importación masiva: "${book.title}"`,
                    };
                    await auditMethod.call(this.auditService, auditData, transaction);
                }
                result.successful++;
            }
            catch (error) {
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
    async findOrCreateAuthor(name, transaction) {
        let author = await this.authorModel.findOne({
            where: { name },
            transaction,
        });
        if (!author) {
            author = await this.authorModel.create({ name }, { transaction });
        }
        return author.id;
    }
    async findOrCreatePublisher(name, transaction) {
        let publisher = await this.publisherModel.findOne({
            where: { name },
            transaction,
        });
        if (!publisher) {
            publisher = await this.publisherModel.create({ name }, { transaction });
        }
        return publisher.id;
    }
    async findOrCreateGenre(name, transaction) {
        let genre = await this.genreModel.findOne({
            where: { name },
            transaction,
        });
        if (!genre) {
            genre = await this.genreModel.create({ name }, { transaction });
        }
        return genre.id;
    }
};
exports.BatchOperationsService = BatchOperationsService;
exports.BatchOperationsService = BatchOperationsService = BatchOperationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(book_entity_1.Book)),
    __param(1, (0, sequelize_1.InjectModel)(author_entity_1.Author)),
    __param(2, (0, sequelize_1.InjectModel)(publisher_entity_1.Publisher)),
    __param(3, (0, sequelize_1.InjectModel)(genre_entity_1.Genre)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, transaction_service_1.TransactionService,
        audit_service_1.AuditService])
], BatchOperationsService);
//# sourceMappingURL=batch-operations.service.js.map