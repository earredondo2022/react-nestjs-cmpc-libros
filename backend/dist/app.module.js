"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const auth_module_1 = require("./auth/auth.module");
const books_module_1 = require("./books/books.module");
const authors_module_1 = require("./authors/authors.module");
const publishers_module_1 = require("./publishers/publishers.module");
const genres_module_1 = require("./genres/genres.module");
const audit_module_1 = require("./audit/audit.module");
const test_module_1 = require("./test/test.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            sequelize_1.SequelizeModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    const useSqlite = configService.get('USE_SQLITE') === 'true' &&
                        configService.get('DATABASE_HOST') === 'localhost';
                    if (useSqlite) {
                        return {
                            dialect: 'sqlite',
                            storage: configService.get('DATABASE_NAME') || 'cmpc_libros_test.db',
                            models: [],
                            autoLoadModels: true,
                            synchronize: true,
                            logging: process.env.NODE_ENV === 'development' ? console.log : false,
                        };
                    }
                    return {
                        dialect: 'postgres',
                        host: configService.get('DATABASE_HOST') || 'postgres',
                        port: parseInt(configService.get('DATABASE_PORT')) || 5432,
                        username: configService.get('DATABASE_USER') || 'postgres',
                        password: configService.get('DATABASE_PASSWORD') || 'postgres123',
                        database: configService.get('DATABASE_NAME') || 'cmpc_libros',
                        models: [],
                        autoLoadModels: true,
                        synchronize: false,
                        logging: process.env.NODE_ENV === 'development' ? console.log : false,
                    };
                },
                inject: [config_1.ConfigService],
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            auth_module_1.AuthModule,
            books_module_1.BooksModule,
            authors_module_1.AuthorsModule,
            publishers_module_1.PublishersModule,
            genres_module_1.GenresModule,
            audit_module_1.AuditModule,
            test_module_1.TestModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map