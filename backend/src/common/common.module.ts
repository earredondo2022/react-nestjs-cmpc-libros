import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TransactionService } from './services/transaction.service';
import { BatchOperationsService } from './services/batch-operations.service';
import { TransactionErrorHandler } from './services/transaction-error-handler.service';
import { TransactionMiddleware } from './middleware/transaction.middleware';
import { Book } from '../books/entities/book.entity';
import { Author } from '../authors/entities/author.entity';
import { Publisher } from '../publishers/entities/publisher.entity';
import { Genre } from '../genres/entities/genre.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Book, Author, Publisher, Genre]),
    AuditModule,
  ],
  providers: [
    TransactionService, 
    BatchOperationsService, 
    TransactionErrorHandler,
    TransactionMiddleware,
  ],
  exports: [
    TransactionService, 
    BatchOperationsService, 
    TransactionErrorHandler,
    TransactionMiddleware,
  ],
})
export class CommonModule {}