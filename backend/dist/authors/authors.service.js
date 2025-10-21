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
exports.AuthorsService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const author_entity_1 = require("./entities/author.entity");
let AuthorsService = class AuthorsService {
    constructor(authorModel) {
        this.authorModel = authorModel;
    }
    async create(authorData) {
        return this.authorModel.create(authorData);
    }
    async findAll() {
        return this.authorModel.findAll();
    }
    async findById(id) {
        return this.authorModel.findByPk(id);
    }
    async update(id, authorData) {
        const [updatedRowsCount] = await this.authorModel.update(authorData, {
            where: { id },
        });
        if (updatedRowsCount === 0) {
            return null;
        }
        return this.findById(id);
    }
    async remove(id) {
        const deletedRowsCount = await this.authorModel.destroy({
            where: { id },
        });
        return deletedRowsCount > 0;
    }
};
exports.AuthorsService = AuthorsService;
exports.AuthorsService = AuthorsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(author_entity_1.Author)),
    __metadata("design:paramtypes", [Object])
], AuthorsService);
//# sourceMappingURL=authors.service.js.map