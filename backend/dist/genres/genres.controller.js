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
exports.GenresController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const genres_service_1 = require("./genres.service");
const genre_entity_1 = require("./entities/genre.entity");
let GenresController = class GenresController {
    constructor(genresService) {
        this.genresService = genresService;
    }
    async findAll() {
        return this.genresService.findAll();
    }
    async findById(id) {
        return this.genresService.findById(id);
    }
    async create(genreData) {
        if (!genreData.name) {
            throw new common_1.BadRequestException('Name is required');
        }
        return this.genresService.create(genreData);
    }
    async update(id, genreData) {
        return this.genresService.update(id, genreData);
    }
    async remove(id) {
        const deleted = await this.genresService.remove(id);
        return { deleted };
    }
};
exports.GenresController = GenresController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all genres' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return all genres', type: [genre_entity_1.Genre] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GenresController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get genre by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Genre ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return genre by ID', type: genre_entity_1.Genre }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Genre not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GenresController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new genre' }),
    (0, swagger_1.ApiBody)({
        description: 'Genre data',
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', example: 'Science Fiction' },
                description: { type: 'string', example: 'Books about future technology and space' }
            },
            required: ['name']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Genre created successfully', type: genre_entity_1.Genre }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Name is required' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GenresController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update genre by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Genre ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
    (0, swagger_1.ApiBody)({
        description: 'Updated genre data',
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', example: 'Fantasy' },
                description: { type: 'string', example: 'Books with magical elements' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Genre updated successfully', type: genre_entity_1.Genre }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Genre not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GenresController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete genre by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Genre ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Genre deleted successfully', schema: { type: 'object', properties: { deleted: { type: 'boolean', example: true } } } }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Genre not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GenresController.prototype, "remove", null);
exports.GenresController = GenresController = __decorate([
    (0, swagger_1.ApiTags)('Genres'),
    (0, common_1.Controller)('genres'),
    __metadata("design:paramtypes", [genres_service_1.GenresService])
], GenresController);
//# sourceMappingURL=genres.controller.js.map