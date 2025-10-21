"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const helmet_1 = require("helmet");
const path_1 = require("path");
const express = require("express");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https:"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "http://localhost:3000", "http://localhost:3001"],
                connectSrc: ["'self'", "http://localhost:3000", "http://localhost:3001"],
            },
        },
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    });
    app.use('/uploads', express.static((0, path_1.join)(__dirname, '..', 'uploads')));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.setGlobalPrefix('api');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('CMPC-libros API')
        .setDescription('API for CMPC-libros book store management system')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0');
    common_1.Logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap');
    common_1.Logger.log(`Swagger docs: http://localhost:${port}/api/docs`, 'Bootstrap');
}
bootstrap();
//# sourceMappingURL=main.js.map