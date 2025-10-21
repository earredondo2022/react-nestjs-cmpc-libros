import { Model } from 'sequelize-typescript';
import { Book } from '../../books/entities/book.entity';
export declare class Author extends Model<Author> {
    id: string;
    name: string;
    biography: string;
    birthDate: Date;
    nationality: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    books: Book[];
}
