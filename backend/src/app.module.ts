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
      useFactory: (configService: ConfigService) => {
        // Use SQLite only in local development when explicitly enabled
        // In Docker environment, always use PostgreSQL
        const useSqlite = configService.get('USE_SQLITE') === 'true' && 
                          configService.get('DATABASE_HOST') === 'localhost';
        
        if (useSqlite) {
          return {
            dialect: 'sqlite',
            storage: configService.get('DATABASE_NAME') || 'cmpc_libros_test.db',
            models: [],
            autoLoadModels: true,
            synchronize: true, // Auto-create tables for SQLite
            logging: process.env.NODE_ENV === 'development' ? console.log : false,
          };
        }
        
        // Default to PostgreSQL (Docker and production)
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