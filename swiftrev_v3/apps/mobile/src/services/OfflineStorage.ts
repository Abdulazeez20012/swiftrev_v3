import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export interface SyncItem {
    id: string;
    type: 'transaction' | 'patient';
    data: any;
    timestamp: number;
    retryCount: number;
}

class OfflineStorage {
    // Generic put
    async put(key: string, data: any) {
        try {
            const jsonValue = JSON.stringify(data);
            await AsyncStorage.setItem(key, jsonValue);
        } catch (e) {
            console.error(`Error saving data for ${key}:`, e);
        }
    }

    // Generic get
    async get(key: string) {
        try {
            const jsonValue = await AsyncStorage.getItem(key);
            return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (e) {
            console.error(`Error reading data for ${key}:`, e);
            return null;
        }
    }

    // Generic delete
    async delete(key: string) {
        try {
            await AsyncStorage.removeItem(key);
        } catch (e) {
            console.error(`Error removing data for ${key}:`, e);
        }
    }

    // --- Specific Sync Helpers ---

    async addToSyncQueue(type: 'transaction' | 'patient', data: any) {
        const queue: SyncItem[] = (await this.get('sync_queue')) || [];
        const item: SyncItem = {
            id: uuidv4(),
            type,
            data,
            timestamp: Date.now(),
            retryCount: 0
        };
        queue.push(item);
        await this.put('sync_queue', queue);
        return item;
    }

    async getSyncQueue(): Promise<SyncItem[]> {
        return (await this.get('sync_queue')) || [];
    }

    async removeFromSyncQueue(id: string) {
        const queue: SyncItem[] = (await this.get('sync_queue')) || [];
        const filtered = queue.filter(item => item.id !== id);
        await this.put('sync_queue', filtered);
    }

    // Cache helpers
    async updateCache(key: 'patients' | 'revenue_items' | 'history', items: any[]) {
        await this.put(key, items);
    }

    async getAll(key: 'patients' | 'revenue_items' | 'history'): Promise<any[]> {
        return (await this.get(key)) || [];
    }
}

export const offlineStorage = new OfflineStorage();
