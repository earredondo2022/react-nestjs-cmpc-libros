import { Request, Response } from 'express';
import { BooksService } from './books.service';
import { Book } from './entities/book.entity';
export declare class BooksController {
    private readonly booksService;
    constructor(booksService: BooksService);
    private getAuditContext;
    create(createBookDto: {
        title: string;
        isbn?: string;
        price: number;
        stockQuantity: number;
        isAvailable?: boolean;
        publicationDate?: Date;
        pages?: number;
        description?: string;
        imageUrl?: string;
        authorId?: string;
        publisherId?: string;
        genreId?: string;
    }, image?: Express.Multer.File, req?: Request): Promise<Book>;
    findAll(page?: string, limit?: string, sortBy?: string, sortOrder?: 'ASC' | 'DESC', title?: string, authorId?: string, publisherId?: string, genreId?: string, isAvailable?: string): Promise<{
        books: Book[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Book | null>;
    update(id: string, updateBookDto: Partial<Book> & {
        imageUrl?: string;
    }, image?: Express.Multer.File, req?: Request): Promise<Book | null>;
    exportToCsv(title?: string, authorId?: string, publisherId?: string, genreId?: string, isAvailable?: string, res?: Response, req?: Request): Promise<void>;
    remove(id: string, req?: Request): Promise<{
        message: string;
    }>;
}
