import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize, Transaction } from 'sequelize';

export interface TransactionCallback<T = any> {
  (transaction: Transaction): Promise<T>;
}

@Injectable()
export class TransactionService {
  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  /**
   * Ejecuta una función dentro de una transacción manejada automáticamente
   * Si la función se completa exitosamente, la transacción se confirma
   * Si ocurre un error, la transacción se revierte automáticamente
   */
  async runInTransaction<T>(
    callback: TransactionCallback<T>,
    isolationLevel?: Transaction.ISOLATION_LEVELS,
  ): Promise<T> {
    const transaction = await this.sequelize.transaction({
      isolationLevel: isolationLevel || Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      console.error('Transaction rolled back due to error:', error);
      throw error;
    }
  }

  /**
   * Crea una transacción manual que debe ser manejada explícitamente
   * Útil para casos donde se necesita control granular sobre cuándo confirmar o revertir
   */
  async createTransaction(
    isolationLevel?: Transaction.ISOLATION_LEVELS,
  ): Promise<Transaction> {
    return this.sequelize.transaction({
      isolationLevel: isolationLevel || Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });
  }

  /**
   * Ejecuta múltiples operaciones en paralelo dentro de una transacción
   * Todas las operaciones deben completarse exitosamente o todas se revierten
   */
  async runInParallelTransaction<T>(
    callbacks: TransactionCallback<T>[],
    isolationLevel?: Transaction.ISOLATION_LEVELS,
  ): Promise<T[]> {
    return this.runInTransaction(async (transaction) => {
      return Promise.all(callbacks.map(callback => callback(transaction)));
    }, isolationLevel);
  }

  /**
   * Ejecuta operaciones en secuencia dentro de una transacción
   * Si cualquier operación falla, todas las anteriores se revierten
   */
  async runInSequentialTransaction<T>(
    callbacks: TransactionCallback<T>[],
    isolationLevel?: Transaction.ISOLATION_LEVELS,
  ): Promise<T[]> {
    return this.runInTransaction(async (transaction) => {
      const results: T[] = [];
      
      for (const callback of callbacks) {
        const result = await callback(transaction);
        results.push(result);
      }
      
      return results;
    }, isolationLevel);
  }

  /**
   * Ejecuta una función con un savepoint (punto de guardado)
   * Permite rollback parcial dentro de una transacción más grande
   */
  async runWithSavepoint<T>(
    transaction: Transaction,
    savepointName: string,
    callback: TransactionCallback<T>,
  ): Promise<T> {
    await this.sequelize.query(`SAVEPOINT ${savepointName}`, { transaction });
    
    try {
      const result = await callback(transaction);
      await this.sequelize.query(`RELEASE SAVEPOINT ${savepointName}`, { transaction });
      return result;
    } catch (error) {
      await this.sequelize.query(`ROLLBACK TO SAVEPOINT ${savepointName}`, { transaction });
      throw error;
    }
  }

  /**
   * Obtiene estadísticas básicas de conexiones
   */
  async getConnectionStats(): Promise<{
    databaseName: string;
    dialect: string;
    connectionPoolMax: number;
  }> {
    const config = this.sequelize.config;
    
    return {
      databaseName: config.database || 'unknown',
      dialect: this.sequelize.getDialect() || 'unknown',
      connectionPoolMax: (config.pool?.max as number) || 5,
    };
  }

  /**
   * Configuración de timeout para transacciones largas
   */
  async runInTransactionWithTimeout<T>(
    callback: TransactionCallback<T>,
    timeoutMs: number = 30000, // 30 segundos por defecto
    isolationLevel?: Transaction.ISOLATION_LEVELS,
  ): Promise<T> {
    return Promise.race([
      this.runInTransaction(callback, isolationLevel),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Transaction timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }
}