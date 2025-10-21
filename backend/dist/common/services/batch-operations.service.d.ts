import { Book } from '../../books/entities/book.entity';
import { Author } from '../../authors/entities/author.entity';
import { Publisher } from '../../publishers/entities/publisher.entity';
import { Genre } from '../../genres/entities/genre.entity';
import { TransactionService } from './transaction.service';
import { AuditService } from '../../audit/audit.service';
export interface BatchBookData {
    title: string;
    isbn?: string;
    price: number;
    stockQuantity?: number;
    isAvailable?: boolean;
    publicationDate?: string;
    pages?: number;
    description?: string;
    imageUrl?: string;
    authorName?: string;
    publisherName?: string;
    genreName?: string;
}
export interface BatchOperationResult {
    totalProcessed: number;
    successful: number;
    failed: number;
    errors: Array<{
        row: number;
        data: any;
        error: string;
    }>;
    created?: string[];
    updated?: string[];
    deleted?: string[];
}
export interface BatchOperationOptions {
    batchSize?: number;
    continueOnError?: boolean;
    validateOnly?: boolean;
    updateExisting?: boolean;
    auditContext?: {
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
    };
}
export declare class BatchOperationsService {
    private bookModel;
    private authorModel;
    private publisherModel;
    private genreModel;
    private transactionService;
    private auditService;
    private readonly logger;
    private readonly DEFAULT_BATCH_SIZE;
    constructor(bookModel: typeof Book, authorModel: typeof Author, publisherModel: typeof Publisher, genreModel: typeof Genre, transactionService: TransactionService, auditService: AuditService);
    importBooksFromCsv(csvData: string, options?: BatchOperationOptions): Promise<BatchOperationResult>;
    bulkUpdateBooks(updates: Array<{
        id: string;
        updates: Partial<Book>;
    }>, options?: BatchOperationOptions): Promise<BatchOperationResult>;
    bulkDeleteBooks(bookIds: string[], options?: BatchOperationOptions): Promise<BatchOperationResult>;
    processMultipleOperations(operations: Array<{
        type: 'create' | 'update' | 'delete';
        data: any;
    }>, options?: BatchOperationOptions): Promise<BatchOperationResult>;
    private parseCsvData;
    private parseCsvRow;
    private processBooksInBatch;
    private findOrCreateAuthor;
    private findOrCreatePublisher;
    private findOrCreateGenre;
}
