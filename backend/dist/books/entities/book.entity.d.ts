import { Model } from 'sequelize-typescript';
import { Author } from '../../authors/entities/author.entity';
import { Publisher } from '../../publishers/entities/publisher.entity';
import { Genre } from '../../genres/entities/genre.entity';
export declare class Book extends Model<Book> {
    id: string;
    title: string;
    isbn: string;
    price: number;
    stockQuantity: number;
    isAvailable: boolean;
    publicationDate: Date;
    pages: number;
    description: string;
    imageUrl: string;
    authorId: string;
    publisherId: string;
    genreId: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    author: Author;
    publisher: Publisher;
    genre: Genre;
    get availability(): string;
}
