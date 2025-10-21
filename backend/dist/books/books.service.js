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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooksService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const sequelize_2 = require("sequelize");
const book_entity_1 = require("./entities/book.entity");
const author_entity_1 = require("../authors/entities/author.entity");
const publisher_entity_1 = require("../publishers/entities/publisher.entity");
const genre_entity_1 = require("../genres/entities/genre.entity");
const audit_service_1 = require("../audit/audit.service");
const transaction_service_1 = require("../common/services/transaction.service");
let BooksService = class BooksService {
    constructor(bookModel, auditService, transactionService) {
        this.bookModel = bookModel;
        this.auditService = auditService;
        this.transactionService = transactionService;
    }
    async create(bookData, auditContext) {
        return await this.transactionService.runInTransaction(async (transaction) => {
            const newBook = await this.bookModel.create(bookData, { transaction });
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
    async findAll(page = 1, limit = 10, filters, sortBy = 'createdAt', sortOrder = 'DESC') {
        const offset = (page - 1) * limit;
        const where = {};
        if (filters?.title) {
            where.title = { [sequelize_2.Op.iLike]: `%${filters.title}%` };
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
        const fieldMap = {
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
                { model: author_entity_1.Author, attributes: ['id', 'name'] },
                { model: publisher_entity_1.Publisher, attributes: ['id', 'name'] },
                { model: genre_entity_1.Genre, attributes: ['id', 'name'] }
            ]
        });
        return { books, total };
    }
    async findById(id) {
        return this.bookModel.findByPk(id, {
            include: [
                { model: author_entity_1.Author, attributes: ['id', 'name'] },
                { model: publisher_entity_1.Publisher, attributes: ['id', 'name'] },
                { model: genre_entity_1.Genre, attributes: ['id', 'name'] }
            ]
        });
    }
    async update(id, bookData, auditContext) {
        return await this.transactionService.runInTransaction(async (transaction) => {
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
                    { model: author_entity_1.Author, attributes: ['id', 'name'] },
                    { model: publisher_entity_1.Publisher, attributes: ['id', 'name'] },
                    { model: genre_entity_1.Genre, attributes: ['id', 'name'] }
                ],
                transaction,
            });
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
    async remove(id, auditContext) {
        return await this.transactionService.runInTransaction(async (transaction) => {
            const bookToDelete = auditContext ? await this.findById(id) : null;
            const deletedRowsCount = await this.bookModel.destroy({
                where: { id },
                transaction,
            });
            const wasDeleted = deletedRowsCount > 0;
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
    async exportToCsv(filters, auditContext) {
        const where = {};
        if (filters?.title) {
            where.title = { [sequelize_2.Op.iLike]: `%${filters.title}%` };
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
        const books = await this.bookModel.findAll({
            where,
            order: [['title', 'ASC']],
            include: [
                { model: author_entity_1.Author, attributes: ['id', 'name'] },
                { model: publisher_entity_1.Publisher, attributes: ['id', 'name'] },
                { model: genre_entity_1.Genre, attributes: ['id', 'name'] }
            ]
        });
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
        const escapeCsvValue = (value) => {
            if (value === null || value === undefined) {
                return '';
            }
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        };
        const formatDate = (date) => {
            if (!date)
                return '';
            const d = new Date(date);
            return d.toLocaleDateString('es-ES');
        };
        const formatPrice = (price) => {
            if (price === null || price === undefined || price === '') {
                return '0.00';
            }
            const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
            if (isNaN(numPrice)) {
                return '0.00';
            }
            return numPrice.toFixed(2);
        };
        const csvRows = books.map(book => [
            escapeCsvValue(book.id),
            escapeCsvValue(book.title),
            escapeCsvValue(book.isbn || ''),
            escapeCsvValue(book.author?.name || ''),
            escapeCsvValue(book.publisher?.name || ''),
            escapeCsvValue(book.genre?.name || ''),
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
        const csvContent = [headers.join(','), ...csvRows].join('\n');
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
};
exports.BooksService = BooksService;
exports.BooksService = BooksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(book_entity_1.Book)),
    __metadata("design:paramtypes", [Object, audit_service_1.AuditService,
        transaction_service_1.TransactionService])
], BooksService);
//# sourceMappingURL=books.service.js.map