import { Model } from 'sequelize-typescript';
import { Book } from '../../books/entities/book.entity';
export declare class Publisher extends Model<Publisher> {
    id: string;
    name: string;
    country: string;
    foundedYear: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    books: Book[];
}
