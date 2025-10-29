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
exports.BooksController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const multer_1 = require("multer");
const path_1 = require("path");
const books_service_1 = require("./books.service");
const book_entity_1 = require("./entities/book.entity");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let BooksController = class BooksController {
    constructor(booksService) {
        this.booksService = booksService;
    }
    getAuditContext(req) {
        var _a, _b;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || '1';
        const ipAddress = req.ip || ((_b = req.connection) === null || _b === void 0 ? void 0 : _b.remoteAddress) || req.headers['x-forwarded-for'] || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        return {
            userId,
            ipAddress,
            userAgent,
        };
    }
    async create(createBookDto, image, req) {
        var _a, _b, _c, _d;
        if (!((_a = createBookDto.title) === null || _a === void 0 ? void 0 : _a.trim())) {
            throw new common_1.BadRequestException('El título es requerido');
        }
        const price = parseFloat(((_b = createBookDto.price) === null || _b === void 0 ? void 0 : _b.toString()) || '0');
        if (isNaN(price) || price <= 0) {
            throw new common_1.BadRequestException('El precio es requerido y debe ser mayor que 0');
        }
        const stockQuantity = parseInt(((_c = createBookDto.stockQuantity) === null || _c === void 0 ? void 0 : _c.toString()) || '0');
        if (isNaN(stockQuantity) || stockQuantity < 0) {
            throw new common_1.BadRequestException('La cantidad en stock es requerida y debe ser mayor o igual a 0');
        }
        const bookData = {
            ...createBookDto,
            price,
            stockQuantity,
            imageUrl: image ? `/uploads/${image.filename}` :
                (((_d = createBookDto.imageUrl) === null || _d === void 0 ? void 0 : _d.trim()) ? createBookDto.imageUrl.trim() : undefined),
        };
        return this.booksService.create(bookData, this.getAuditContext(req));
    }
    async findAll(page = '1', limit = '10', sortBy = 'createdAt', sortOrder = 'DESC', title, authorId, publisherId, genreId, isAvailable) {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const filters = {
            title,
            authorId,
            publisherId,
            genreId,
            isAvailable,
        };
        Object.keys(filters).forEach(key => {
            if (filters[key] === undefined) {
                delete filters[key];
            }
        });
        const result = await this.booksService.findAll(pageNum, limitNum, filters, sortBy, sortOrder);
        return {
            ...result,
            page: pageNum,
            limit: limitNum,
        };
    }
    async findOne(id) {
        return this.booksService.findById(id);
    }
    async update(id, updateBookDto, image, req) {
        var _a, _b, _c, _d;
        const bookData = {
            ...updateBookDto,
        };
        if (updateBookDto.price !== undefined) {
            const price = parseFloat(((_a = updateBookDto.price) === null || _a === void 0 ? void 0 : _a.toString()) || '0');
            if (isNaN(price) || price <= 0) {
                throw new common_1.BadRequestException('El precio debe ser mayor que 0');
            }
            bookData.price = price;
        }
        if (updateBookDto.stockQuantity !== undefined) {
            const stockQuantity = parseInt(((_b = updateBookDto.stockQuantity) === null || _b === void 0 ? void 0 : _b.toString()) || '0');
            if (isNaN(stockQuantity) || stockQuantity < 0) {
                throw new common_1.BadRequestException('La cantidad en stock debe ser mayor o igual a 0');
            }
            bookData.stockQuantity = stockQuantity;
        }
        if (updateBookDto.title !== undefined && !((_c = updateBookDto.title) === null || _c === void 0 ? void 0 : _c.trim())) {
            throw new common_1.BadRequestException('El título no puede estar vacío');
        }
        if (image) {
            bookData.imageUrl = `/uploads/${image.filename}`;
        }
        else if (updateBookDto.imageUrl !== undefined) {
            bookData.imageUrl = ((_d = updateBookDto.imageUrl) === null || _d === void 0 ? void 0 : _d.trim()) || null;
        }
        return this.booksService.update(id, bookData, this.getAuditContext(req));
    }
    async exportToCsv(title, authorId, publisherId, genreId, isAvailable, res, req) {
        const filters = {
            title,
            authorId,
            publisherId,
            genreId,
            isAvailable,
        };
        Object.keys(filters).forEach(key => {
            if (filters[key] === undefined) {
                delete filters[key];
            }
        });
        try {
            const csvData = await this.booksService.exportToCsv(filters, this.getAuditContext(req));
            const filename = `libros_export_${new Date().toISOString().slice(0, 10)}.csv`;
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
            res.write('\uFEFF');
            res.end(csvData);
        }
        catch (error) {
            console.error('Error exporting CSV:', error);
            throw new common_1.BadRequestException('Error al generar el archivo CSV');
        }
    }
    async remove(id, req) {
        const book = await this.booksService.findById(id);
        if (!book) {
            throw new common_1.BadRequestException('Libro no encontrado');
        }
        const result = await this.booksService.remove(id, this.getAuditContext(req));
        if (result) {
            return { message: 'Libro eliminado exitosamente' };
        }
        else {
            throw new common_1.BadRequestException('Error al eliminar el libro');
        }
    }
};
exports.BooksController = BooksController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create book' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Book created successfully', type: book_entity_1.Book }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = (0, path_1.extname)(file.originalname);
                callback(null, `book-${uniqueSuffix}${ext}`);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (!file) {
                return callback(null, true);
            }
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return callback(new Error('Solo se permiten archivos de imagen!'), false);
            }
            callback(null, true);
        },
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all books with pagination and filters' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return paginated books' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('sortBy')),
    __param(3, (0, common_1.Query)('sortOrder')),
    __param(4, (0, common_1.Query)('title')),
    __param(5, (0, common_1.Query)('authorId')),
    __param(6, (0, common_1.Query)('publisherId')),
    __param(7, (0, common_1.Query)('genreId')),
    __param(8, (0, common_1.Query)('isAvailable')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get book by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return book by ID', type: book_entity_1.Book }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update book' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Book updated successfully', type: book_entity_1.Book }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = (0, path_1.extname)(file.originalname);
                callback(null, `book-${uniqueSuffix}${ext}`);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (!file) {
                return callback(null, true);
            }
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return callback(new Error('Solo se permiten archivos de imagen!'), false);
            }
            callback(null, true);
        },
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "update", null);
__decorate([
    (0, common_1.Get)('export/csv'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Export books to CSV' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'CSV file generated successfully' }),
    __param(0, (0, common_1.Query)('title')),
    __param(1, (0, common_1.Query)('authorId')),
    __param(2, (0, common_1.Query)('publisherId')),
    __param(3, (0, common_1.Query)('genreId')),
    __param(4, (0, common_1.Query)('isAvailable')),
    __param(5, (0, common_1.Res)()),
    __param(6, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "exportToCsv", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete book (soft delete)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Book deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "remove", null);
exports.BooksController = BooksController = __decorate([
    (0, swagger_1.ApiTags)('Books'),
    (0, common_1.Controller)('books'),
    __metadata("design:paramtypes", [books_service_1.BooksService])
], BooksController);
//# sourceMappingURL=books.controller.js.map