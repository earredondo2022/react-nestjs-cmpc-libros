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
exports.Author = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const swagger_1 = require("@nestjs/swagger");
const book_entity_1 = require("../../books/entities/book.entity");
let Author = class Author extends sequelize_typescript_1.Model {
};
exports.Author = Author;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Author ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
        primaryKey: true,
    }),
    __metadata("design:type", String)
], Author.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Author name',
        example: 'Gabriel García Márquez',
    }),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
    }),
    __metadata("design:type", String)
], Author.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Author biography',
        example: 'Colombian novelist and Nobel Prize winner...',
        required: false,
    }),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: true,
    }),
    __metadata("design:type", String)
], Author.prototype, "biography", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Author birth date',
        example: '1927-03-06',
        required: false,
    }),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATEONLY,
        allowNull: true,
        field: 'birth_date',
    }),
    __metadata("design:type", Date)
], Author.prototype, "birthDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Author nationality',
        example: 'Colombian',
        required: false,
    }),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    __metadata("design:type", String)
], Author.prototype, "nationality", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Author creation date',
        example: '2023-01-01T00:00:00.000Z',
    }),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        defaultValue: sequelize_typescript_1.DataType.NOW,
        field: 'created_at',
    }),
    __metadata("design:type", Date)
], Author.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Author last update date',
        example: '2023-01-01T00:00:00.000Z',
    }),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        defaultValue: sequelize_typescript_1.DataType.NOW,
        field: 'updated_at',
    }),
    __metadata("design:type", Date)
], Author.prototype, "updatedAt", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: true,
        field: 'deleted_at',
    }),
    __metadata("design:type", Date)
], Author.prototype, "deletedAt", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => book_entity_1.Book),
    __metadata("design:type", Array)
], Author.prototype, "books", void 0);
exports.Author = Author = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'authors',
        timestamps: true,
        paranoid: true,
    })
], Author);
//# sourceMappingURL=author.entity.js.map