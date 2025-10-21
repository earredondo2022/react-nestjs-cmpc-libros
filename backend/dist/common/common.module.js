"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const transaction_service_1 = require("./services/transaction.service");
const batch_operations_service_1 = require("./services/batch-operations.service");
const transaction_error_handler_service_1 = require("./services/transaction-error-handler.service");
const transaction_middleware_1 = require("./middleware/transaction.middleware");
const book_entity_1 = require("../books/entities/book.entity");
const author_entity_1 = require("../authors/entities/author.entity");
const publisher_entity_1 = require("../publishers/entities/publisher.entity");
const genre_entity_1 = require("../genres/entities/genre.entity");
const audit_module_1 = require("../audit/audit.module");
let CommonModule = class CommonModule {
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Module)({
        imports: [
            sequelize_1.SequelizeModule.forFeature([book_entity_1.Book, author_entity_1.Author, publisher_entity_1.Publisher, genre_entity_1.Genre]),
            audit_module_1.AuditModule,
        ],
        providers: [
            transaction_service_1.TransactionService,
            batch_operations_service_1.BatchOperationsService,
            transaction_error_handler_service_1.TransactionErrorHandler,
            transaction_middleware_1.TransactionMiddleware,
        ],
        exports: [
            transaction_service_1.TransactionService,
            batch_operations_service_1.BatchOperationsService,
            transaction_error_handler_service_1.TransactionErrorHandler,
            transaction_middleware_1.TransactionMiddleware,
        ],
    })
], CommonModule);
//# sourceMappingURL=common.module.js.map