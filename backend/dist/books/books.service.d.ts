import { Book } from './entities/book.entity';
import { AuditService } from '../audit/audit.service';
import { TransactionService } from '../common/services/transaction.service';
export declare class BooksService {
    private bookModel;
    private auditService;
    private transactionService;
    constructor(bookModel: typeof Book, auditService: AuditService, transactionService: TransactionService);
    create(bookData: {
        title: string;
        isbn?: string;
        price: number;
        stockQuantity?: number;
        isAvailable?: boolean;
        publicationDate?: Date;
        pages?: number;
        description?: string;
        imageUrl?: string;
        authorId?: string;
        publisherId?: string;
        genreId?: string;
    }, auditContext?: {
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<Book>;
    findAll(page?: number, limit?: number, filters?: {
        title?: string;
        authorId?: string;
        publisherId?: string;
        genreId?: string;
        isAvailable?: boolean | string;
    }, sortBy?: string, sortOrder?: 'ASC' | 'DESC'): Promise<{
        books: Book[];
        total: number;
    }>;
    findById(id: string): Promise<Book | null>;
    update(id: string, bookData: Partial<Book>, auditContext?: {
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<Book | null>;
    remove(id: string, auditContext?: {
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<boolean>;
    exportToCsv(filters?: {
        title?: string;
        authorId?: string;
        publisherId?: string;
        genreId?: string;
        isAvailable?: string;
    }, auditContext?: {
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<string>;
}
