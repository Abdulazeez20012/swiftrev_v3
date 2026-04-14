import { syncManager } from '../services/SyncManager';
import { offlineStorage } from '../services/OfflineStorage';
import api from '../services/api';

jest.mock('../services/OfflineStorage');
jest.mock('../services/api');
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn().mockResolvedValue({ isConnected: true }),
}));

describe('SyncManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should queue items when offline', async () => {
        const data = { amount: 100 };
        await syncManager.queueOffline('transaction', data);
        expect(offlineStorage.addToSyncQueue).toHaveBeenCalledWith('transaction', data);
    });

    it('should sync pending items when online', async () => {
        const mockQueue = [
            { id: '1', type: 'transaction', data: { amount: 100 } },
            { id: '2', type: 'patient', data: { name: 'John' } }
        ];
        (offlineStorage.getSyncQueue as jest.Mock).mockResolvedValue(mockQueue);
        (api.post as jest.Mock).mockResolvedValue({ status: 200 });

        await syncManager.syncPending();

        expect(api.post).toHaveBeenCalledTimes(2);
        expect(offlineStorage.removeFromSyncQueue).toHaveBeenCalledTimes(2);
    });

    it('should cache departments correctly', async () => {
        const mockDepts = [{ id: '1', name: 'Cardiology' }];
        (api.get as jest.Mock).mockResolvedValue({ data: mockDepts });

        const result = await syncManager.fetchAndCacheDepartments('hosp-123');

        expect(api.get).toHaveBeenCalledWith('/departments?hospitalId=hosp-123');
        expect(offlineStorage.updateCache).toHaveBeenCalledWith('departments', mockDepts);
        expect(result).toEqual(mockDepts);
    });

    it('should return cached departments when offline', async () => {
        const mockCache = [{ id: '1', name: 'Cached Cardiology' }];
        (offlineStorage.getAll as jest.Mock).mockResolvedValue(mockCache);
        
        // Force offline status in mock if possible, or assume it fails
        (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

        const result = await syncManager.fetchAndCacheDepartments('hosp-123');
        expect(result).toEqual(mockCache);
    });
});
