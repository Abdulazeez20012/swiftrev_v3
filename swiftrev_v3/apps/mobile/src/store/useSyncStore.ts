import { create } from 'zustand';
import { syncManager, SyncStatus } from '../services/SyncManager';

interface SyncState {
    status: SyncStatus;
    pendingCount: number;
    lastSyncTime: string | null;
    progress: number;
    init: () => void;
    addToQueue: (type: 'patient' | 'transaction', data: any) => Promise<void>;
    syncNow: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set) => ({
    status: 'online',
    pendingCount: 0,
    lastSyncTime: null,
    progress: 0,

    init: () => {
        syncManager.addListener((state) => {
            set({
                status: state.status,
                pendingCount: state.pendingCount,
                lastSyncTime: state.lastSyncTime,
                progress: state.progress
            });
        });
    },

    addToQueue: async (type, data) => {
        await syncManager.queueOffline(type, data);
    },

    syncNow: async () => {
        await syncManager.syncPending();
    },
}));
