import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface SyncItem {
    id: string;
    type: 'patient' | 'transaction';
    data: any;
    timestamp: number;
}

interface SyncState {
    queue: SyncItem[];
    isSyncing: boolean;
    addToQueue: (type: 'patient' | 'transaction', data: any) => Promise<void>;
    processQueue: () => Promise<void>;
    loadQueue: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
    queue: [],
    isSyncing: false,

    loadQueue: async () => {
        const stored = await AsyncStorage.getItem('sync_queue');
        if (stored) {
            set({ queue: JSON.parse(stored) });
        }
    },

    addToQueue: async (type, data) => {
        const newItem: SyncItem = {
            id: crypto.randomUUID(),
            type,
            data,
            timestamp: Date.now(),
        };
        const newQueue = [...get().queue, newItem];
        set({ queue: newQueue });
        await AsyncStorage.setItem('sync_queue', JSON.stringify(newQueue));
    },

    processQueue: async () => {
        if (get().isSyncing || get().queue.length === 0) return;

        set({ isSyncing: true });
        const currentQueue = [...get().queue];
        const failedItems: SyncItem[] = [];

        for (const item of currentQueue) {
            try {
                const endpoint = item.type === 'patient' ? '/patients' : '/transactions';
                await api.post(endpoint, { ...item.data, offlineId: item.id });
            } catch (error) {
                console.error(`Sync failed for ${item.id}`, error);
                failedItems.push(item);
            }
        }

        set({ queue: failedItems, isSyncing: false });
        await AsyncStorage.setItem('sync_queue', JSON.stringify(failedItems));
    },
}));
