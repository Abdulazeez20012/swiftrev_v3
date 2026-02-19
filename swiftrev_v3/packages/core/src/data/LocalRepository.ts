import type { BaseRepository } from './Repository';
import type { DataResponse } from '../types';
import type { IStorage } from './Storage';

export class LocalRepository<T extends { id: string }> implements BaseRepository<T> {
    private storage: IStorage;
    private key: string;
    private listeners: ((data: T[]) => void)[] = [];

    constructor(storage: IStorage, key: string) {
        this.storage = storage;
        this.key = key;
    }

    private async getData(): Promise<T[]> {
        const raw = await this.storage.getItem(this.key);
        return raw ? JSON.parse(raw) : [];
    }

    private async saveData(data: T[]): Promise<void> {
        await this.storage.setItem(this.key, JSON.stringify(data));
        this.notify(data);
    }

    private notify(data: T[]): void {
        this.listeners.forEach(l => l(data));
    }

    async getAll(): Promise<DataResponse<T[]>> {
        try {
            const data = await this.getData();
            return { data, error: null };
        } catch (e: any) {
            return { data: null, error: e };
        }
    }

    async getById(id: string): Promise<DataResponse<T>> {
        try {
            const data = await this.getData();
            const item = data.find(i => i.id === id);
            if (!item) throw new Error('Item not found');
            return { data: item, error: null };
        } catch (e: any) {
            return { data: null, error: e };
        }
    }

    async create(item: Omit<T, 'id' | 'created_at'>): Promise<DataResponse<T>> {
        try {
            const data = await this.getData();
            const newItem = {
                ...item,
                id: Math.random().toString(36).substr(2, 9),
                created_at: new Date().toISOString(),
            }; // Treat as shape with created_at, cast to T

            const asT = newItem as unknown as T;
            data.push(asT);
            await this.saveData(data);
            return { data: asT, error: null };
        } catch (e: any) {
            return { data: null, error: e };
        }
    }

    async update(id: string, item: Partial<T>): Promise<DataResponse<T>> {
        try {
            const data = await this.getData();
            const index = data.findIndex(i => i.id === id);
            if (index === -1) throw new Error('Item not found');
            data[index] = { ...data[index], ...item };
            await this.saveData(data);
            return { data: data[index], error: null };
        } catch (e: any) {
            return { data: null, error: e };
        }
    }

    async delete(id: string): Promise<DataResponse<boolean>> {
        try {
            const data = await this.getData();
            const filtered = data.filter(i => i.id !== id);
            await this.saveData(filtered);
            return { data: true, error: null };
        } catch (e: any) {
            return { data: false, error: e };
        }
    }

    subscribe(callback: (data: T[]) => void): () => void {
        this.listeners.push(callback);
        this.getData().then(data => callback(data));
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }
}
