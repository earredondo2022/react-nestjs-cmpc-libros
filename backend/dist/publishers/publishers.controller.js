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
exports.PublishersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const publishers_service_1 = require("./publishers.service");
const publisher_entity_1 = require("./entities/publisher.entity");
let PublishersController = class PublishersController {
    constructor(publishersService) {
        this.publishersService = publishersService;
    }
    async findAll() {
        return this.publishersService.findAll();
    }
};
exports.PublishersController = PublishersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all publishers' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return all publishers', type: [publisher_entity_1.Publisher] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublishersController.prototype, "findAll", null);
exports.PublishersController = PublishersController = __decorate([
    (0, swagger_1.ApiTags)('Publishers'),
    (0, common_1.Controller)('publishers'),
    __metadata("design:paramtypes", [publishers_service_1.PublishersService])
], PublishersController);
//# sourceMappingURL=publishers.controller.js.map