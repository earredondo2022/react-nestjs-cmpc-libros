import { Model } from 'sequelize-typescript';
import { Book } from '../../books/entities/book.entity';
export declare class Genre extends Model<Genre> {
    id: string;
    name: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    books: Book[];
}
