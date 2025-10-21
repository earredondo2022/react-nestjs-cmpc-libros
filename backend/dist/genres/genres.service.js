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
exports.GenresService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const genre_entity_1 = require("./entities/genre.entity");
let GenresService = class GenresService {
    constructor(genreModel) {
        this.genreModel = genreModel;
    }
    async create(genreData) {
        return this.genreModel.create(genreData);
    }
    async findAll() {
        return this.genreModel.findAll();
    }
    async findById(id) {
        return this.genreModel.findByPk(id);
    }
    async update(id, genreData) {
        const [updatedRowsCount] = await this.genreModel.update(genreData, {
            where: { id },
        });
        if (updatedRowsCount === 0) {
            return null;
        }
        return this.findById(id);
    }
    async remove(id) {
        const deletedRowsCount = await this.genreModel.destroy({
            where: { id },
        });
        return deletedRowsCount > 0;
    }
};
exports.GenresService = GenresService;
exports.GenresService = GenresService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(genre_entity_1.Genre)),
    __metadata("design:paramtypes", [Object])
], GenresService);
//# sourceMappingURL=genres.service.js.map