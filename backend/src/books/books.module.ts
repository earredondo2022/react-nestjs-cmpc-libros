import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { Book } from './entities/book.entity';
import { Author } from '../authors/entities/author.entity';
import { Publisher } from '../publishers/entities/publisher.entity';
import { Genre } from '../genres/entities/genre.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([Book, Author, Publisher, Genre]),
  ],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}