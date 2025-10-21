import { Sequelize, Transaction } from 'sequelize';
export interface TransactionCallback<T = any> {
    (transaction: Transaction): Promise<T>;
}
export declare class TransactionService {
    private readonly sequelize;
    constructor(sequelize: Sequelize);
    runInTransaction<T>(callback: TransactionCallback<T>, isolationLevel?: Transaction.ISOLATION_LEVELS): Promise<T>;
    createTransaction(isolationLevel?: Transaction.ISOLATION_LEVELS): Promise<Transaction>;
    runInParallelTransaction<T>(callbacks: TransactionCallback<T>[], isolationLevel?: Transaction.ISOLATION_LEVELS): Promise<T[]>;
    runInSequentialTransaction<T>(callbacks: TransactionCallback<T>[], isolationLevel?: Transaction.ISOLATION_LEVELS): Promise<T[]>;
    runWithSavepoint<T>(transaction: Transaction, savepointName: string, callback: TransactionCallback<T>): Promise<T>;
    getConnectionStats(): Promise<{
        databaseName: string;
        dialect: string;
        connectionPoolMax: number;
    }>;
    runInTransactionWithTimeout<T>(callback: TransactionCallback<T>, timeoutMs?: number, isolationLevel?: Transaction.ISOLATION_LEVELS): Promise<T>;
}
