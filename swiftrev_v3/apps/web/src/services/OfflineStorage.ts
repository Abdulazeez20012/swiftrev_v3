import { openDB, type IDBPDatabase } from 'idb';

export interface SyncItem {
    id: string;
    type: 'transaction' | 'patient';
    data: any;
    timestamp: number;
    retryCount: number;
}

const DB_NAME = 'SwiftRevOffline';
const DB_VERSION = 1;

// Manual UUID v4 generator for non-secure contexts
function generateOfflineId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

class OfflineStorage {
    private dbPromise: Promise<IDBPDatabase>;

    constructor() {
        this.dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Store for caching patients locally
                if (!db.objectStoreNames.contains('patients')) {
                    db.createObjectStore('patients', { keyPath: 'id' });
                }
                // Store for caching revenue items locally
                if (!db.objectStoreNames.contains('revenue_items')) {
                    db.createObjectStore('revenue_items', { keyPath: 'id' });
                }
                // Store for items waiting to be synced to server
                if (!db.objectStoreNames.contains('sync_queue')) {
                    db.createObjectStore('sync_queue', { keyPath: 'id' });
                }
            },
        });
    }

    // Generic put
    async put(storeName: string, item: any) {
        const db = await this.dbPromise;
        return db.put(storeName, item);
    }

    // Generic get all
    async getAll(storeName: string) {
        const db = await this.dbPromise;
        return db.getAll(storeName);
    }

    // Generic delete
    async delete(storeName: string, id: string) {
        const db = await this.dbPromise;
        return db.delete(storeName, id);
    }

    // --- Specific Sync Helpers ---

    async addToSyncQueue(type: 'transaction' | 'patient', data: any) {
        const item: SyncItem = {
            id: generateOfflineId(), // Fallback for insecure browsers
            type,
            data,
            timestamp: Date.now(),
            retryCount: 0
        };
        await this.put('sync_queue', item);
        return item;
    }

    async getSyncQueue(): Promise<SyncItem[]> {
        return this.getAll('sync_queue');
    }

    async removeFromSyncQueue(id: string) {
        await this.delete('sync_queue', id);
    }

    // Bulk update Cache (e.g. after fetching from server)
    async updateCache(storeName: 'patients' | 'revenue_items', items: any[]) {
        const db = await this.dbPromise;
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        await store.clear();
        for (const item of items) {
            await store.put(item);
        }
        await tx.done;
    }
}

export const offlineStorage = new OfflineStorage();
