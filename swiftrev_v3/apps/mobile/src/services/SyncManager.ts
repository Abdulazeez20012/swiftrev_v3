import * as Network from 'expo-network';
import { offlineStorage, SyncItem } from './OfflineStorage';
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SyncStatus = 'online' | 'offline' | 'syncing';

export interface SyncState {
    status: SyncStatus;
    pendingCount: number;
    lastSyncTime: string | null;
    progress: number; // 0 to 1
}

class SyncManager {
    private state: SyncState = {
        status: 'online',
        pendingCount: 0,
        lastSyncTime: null,
        progress: 0,
    };

    private listeners: ((state: SyncState) => void)[] = [];

    constructor() {
        this.init();
    }

    private async init() {
        const storedLastSync = await AsyncStorage.getItem('last_sync_time');
        this.state.lastSyncTime = storedLastSync;

        const networkState = await Network.getNetworkStateAsync();
        this.state.status = networkState.isConnected ? 'online' : 'offline';
        this.state.pendingCount = await this.getPendingCount();
        this.notify();

        setInterval(async () => {
            await this.checkConnectivity();
        }, 15000);
    }

    private async checkConnectivity() {
        const networkState = await Network.getNetworkStateAsync();
        const newStatus = networkState.isConnected ? 'online' : 'offline';

        if (newStatus !== this.state.status) {
            this.state.status = newStatus;
            this.state.pendingCount = await this.getPendingCount();
            this.notify();

            if (this.state.status === 'online') {
                this.syncPending();
            }
        }
    }

    async getPendingCount(): Promise<number> {
        const queue = await offlineStorage.getSyncQueue();
        return queue.length;
    }

    addListener(callback: (state: SyncState) => void) {
        this.listeners.push(callback);
        callback(this.state);
    }

    private notify() {
        this.listeners.forEach(l => l({ ...this.state }));
    }

    async syncPending() {
        const queue = await offlineStorage.getSyncQueue();
        if (queue.length === 0) {
            this.state.lastSyncTime = new Date().toISOString();
            await AsyncStorage.setItem('last_sync_time', this.state.lastSyncTime);
            this.notify();
            return;
        }

        this.state.status = 'syncing';
        this.state.progress = 0;
        this.state.pendingCount = queue.length;
        this.notify();

        const total = queue.length;
        let processed = 0;

        for (const item of queue) {
            try {
                await this.syncItem(item);
                await offlineStorage.removeFromSyncQueue(item.id);
                processed++;
                this.state.progress = processed / total;
                this.state.pendingCount = total - processed;
                this.notify();
            } catch (error) {
                console.error(`Failed to sync item ${item.id}:`, error);
            }
        }

        this.state.lastSyncTime = new Date().toISOString();
        await AsyncStorage.setItem('last_sync_time', this.state.lastSyncTime);

        const networkState = await Network.getNetworkStateAsync();
        this.state.status = networkState.isConnected ? 'online' : 'offline';
        this.state.progress = 1;
        this.state.pendingCount = await this.getPendingCount();
        this.notify();
    }

    private async syncItem(item: SyncItem) {
        if (item.type === 'transaction') {
            return api.post('/transactions', item.data);
        } else if (item.type === 'patient') {
            return api.post('/patients', item.data);
        }
    }

    async queueOffline(type: 'transaction' | 'patient', data: any) {
        await offlineStorage.addToSyncQueue(type, data);
        this.state.pendingCount = await this.getPendingCount();
        this.notify();
    }

    isOnline() {
        return this.state.status === 'online';
    }

    getState() {
        return { ...this.state };
    }
}

export const syncManager = new SyncManager();
