"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishersModule = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const publishers_controller_1 = require("./publishers.controller");
const publishers_service_1 = require("./publishers.service");
const publisher_entity_1 = require("./entities/publisher.entity");
let PublishersModule = class PublishersModule {
};
exports.PublishersModule = PublishersModule;
exports.PublishersModule = PublishersModule = __decorate([
    (0, common_1.Module)({
        imports: [sequelize_1.SequelizeModule.forFeature([publisher_entity_1.Publisher])],
        controllers: [publishers_controller_1.PublishersController],
        providers: [publishers_service_1.PublishersService],
        exports: [publishers_service_1.PublishersService],
    })
], PublishersModule);
//# sourceMappingURL=publishers.module.js.map