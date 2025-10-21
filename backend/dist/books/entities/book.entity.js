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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Book = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const swagger_1 = require("@nestjs/swagger");
const author_entity_1 = require("../../authors/entities/author.entity");
const publisher_entity_1 = require("../../publishers/entities/publisher.entity");
const genre_entity_1 = require("../../genres/entities/genre.entity");
let Book = class Book extends sequelize_typescript_1.Model {
    get availability() {
        if (!this.isAvailable)
            return 'No disponible';
        if (this.stockQuantity === 0)
            return 'Agotado';
        if (this.stockQuantity <= 5)
            return 'Pocas unidades';
        return 'Disponible';
    }
};
exports.Book = Book;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Book ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
        primaryKey: true,
    }),
    __metadata("design:type", String)
], Book.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Book title',
        example: 'One Hundred Years of Solitude',
    }),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(500),
        allowNull: false,
    }),
    __metadata("design:type", String)
], Book.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Book ISBN',
        example: '978-0060883287',
        required: false,
    }),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(17),
        allowNull: true,
        unique: true,
    }),
    __metadata("design:type", String)
], Book.prototype, "isbn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Book price',
        example: 29.99,
    }),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0,
        },
    }),
    __metadata("design:type", Number)
], Book.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Stock quantity',
        example: 50,
    }),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0,
        field: 'stock_quantity',
        validate: {
            min: 0,
        },
    }),
    __metadata("design:type", Number)
], Book.prototype, "stockQuantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Book availability',
        example: true,
    }),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: true,
        field: 'is_available',
    }),
    __metadata("design:type", Boolean)
], Book.prototype, "isAvailable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Publication date',
        example: '1967-05-30',
        required: false,
    }),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATEONLY,
        allowNull: true,
        field: 'publication_date',
    }),
    __metadata("design:type", Date)
], Book.prototype, "publicationDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of pages',
        example: 417,
        required: false,
    }),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: true,
    }),
    __metadata("design:type", Number)
], Book.prototype, "pages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Book description',
        example: 'A landmark novel that tells the story of the Buendía family...',
        required: false,
    }),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: true,
    }),
    __metadata("design:type", String)
], Book.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Book cover image URL',
        example: '/uploads/book-cover-123.jpg',
        required: false,
    }),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(500),
        allowNull: true,
        field: 'image_url',
    }),
    __metadata("design:type", String)
], Book.prototype, "imageUrl", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => author_entity_1.Author),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        allowNull: true,
        field: 'author_id',
    }),
    __metadata("design:type", String)
], Book.prototype, "authorId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => publisher_entity_1.Publisher),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        allowNull: true,
        field: 'publisher_id',
    }),
    __metadata("design:type", String)
], Book.prototype, "publisherId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => genre_entity_1.Genre),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        allowNull: true,
        field: 'genre_id',
    }),
    __metadata("design:type", String)
], Book.prototype, "genreId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Book creation date',
        example: '2023-01-01T00:00:00.000Z',
    }),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        defaultValue: sequelize_typescript_1.DataType.NOW,
        field: 'created_at',
    }),
    __metadata("design:type", Date)
], Book.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Book last update date',
        example: '2023-01-01T00:00:00.000Z',
    }),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        defaultValue: sequelize_typescript_1.DataType.NOW,
        field: 'updated_at',
    }),
    __metadata("design:type", Date)
], Book.prototype, "updatedAt", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: true,
        field: 'deleted_at',
    }),
    __metadata("design:type", Date)
], Book.prototype, "deletedAt", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => author_entity_1.Author),
    __metadata("design:type", author_entity_1.Author)
], Book.prototype, "author", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => publisher_entity_1.Publisher),
    __metadata("design:type", publisher_entity_1.Publisher)
], Book.prototype, "publisher", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => genre_entity_1.Genre),
    __metadata("design:type", genre_entity_1.Genre)
], Book.prototype, "genre", void 0);
exports.Book = Book = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'books',
        timestamps: true,
        paranoid: true,
    })
], Book);
//# sourceMappingURL=book.entity.js.map