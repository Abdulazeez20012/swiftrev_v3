import { offlineStorage } from './OfflineStorage';
import type { SyncItem } from './OfflineStorage';
import api from './api';

type SyncStatus = 'online' | 'offline' | 'syncing';

class SyncManager {
    private status: SyncStatus = navigator.onLine ? 'online' : 'offline';
    private listeners: ((status: SyncStatus, pendingCount: number) => void)[] = [];
    constructor() {
        window.addEventListener('online', () => this.updateStatus('online'));
        window.addEventListener('offline', () => this.updateStatus('offline'));

        // Periodically check for items to sync if online
        setInterval(() => {
            if (this.status === 'online') {
                this.syncPending();
            }
        }, 30000); // Every 30 seconds
    }

    private async updateStatus(newStatus: SyncStatus) {
        this.status = newStatus;
        const pending = await this.getPendingCount();
        this.notify(pending);

        if (newStatus === 'online') {
            this.syncPending();
        }
    }

    async getPendingCount(): Promise<number> {
        const queue = await offlineStorage.getSyncQueue();
        return queue.length;
    }

    addListener(callback: (status: SyncStatus, pendingCount: number) => void) {
        this.listeners.push(callback);
        this.getPendingCount().then(count => callback(this.status, count));
    }

    private notify(pendingCount: number) {
        this.listeners.forEach(l => l(this.status, pendingCount));
    }

    async syncPending() {
        const queue = await offlineStorage.getSyncQueue();
        if (queue.length === 0) return;

        this.status = 'syncing';
        this.notify(queue.length);

        for (const item of queue) {
            try {
                await this.syncItem(item);
                await offlineStorage.removeFromSyncQueue(item.id);
            } catch (error) {
                console.error(`Failed to sync item ${item.id}:`, error);
                // We'll retry in the next interval
            }
        }

        this.status = navigator.onLine ? 'online' : 'offline';
        const remaining = await this.getPendingCount();
        this.notify(remaining);
    }

    private async syncItem(item: SyncItem) {
        if (item.type === 'transaction') {
            return api.post('/transactions', item.data);
        } else if (item.type === 'patient') {
            return api.post('/patients', item.data);
        }
    }

    // Helper to queue an item
    async queueOffline(type: 'transaction' | 'patient', data: any) {
        await offlineStorage.addToSyncQueue(type, data);
        const count = await this.getPendingCount();
        this.notify(count);
    }

    isOnline() {
        return this.status === 'online';
    }
}

export const syncManager = new SyncManager();
