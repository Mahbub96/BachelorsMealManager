// Shared types for database service
// This file has no dependencies on expo-sqlite, so Metro won't try to resolve it

export interface DatabaseService {
  // Core operations
  init(): Promise<void>;
  close(): Promise<void>;

  // Data operations
  saveData(table: string, data: Record<string, any>): Promise<void>;
  getData(
    table: string,
    query?: string,
    params?: any[]
  ): Promise<Record<string, any>[]>;
  updateData(
    table: string,
    id: string,
    data: Record<string, any>
  ): Promise<void>;
  deleteData(table: string, id: string): Promise<void>;
  clearTable(table: string): Promise<void>;

  // Sync operations
  getPendingSync(): Promise<Record<string, any>[]>;
  markSynced(id: string): Promise<void>;
  addToSyncQueue(item: Record<string, any>): Promise<void>;

  // Utility operations
  getTableInfo(table: string): Promise<Record<string, any>[]>;
  executeQuery(query: string, params?: any[]): Promise<any>;

  // Health and maintenance
  healthCheck(): Promise<boolean>;
  vacuum(): Promise<void>;
  optimize(): Promise<void>;
}
