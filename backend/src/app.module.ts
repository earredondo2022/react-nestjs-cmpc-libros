import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { AuthorsModule } from './authors/authors.module';
import { PublishersModule } from './publishers/publishers.module';
import { GenresModule } from './genres/genres.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Database configuration
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
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
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Feature modules
    AuthModule,
    BooksModule,
    AuthorsModule,
    PublishersModule,
    GenresModule,
    AuditModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}