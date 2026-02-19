import { DataService } from 'core';
import { MobileStorage } from '../services/MobileStorage';

let dataServiceInstance: DataService | null = null;

export const useDataService = () => {
    if (!dataServiceInstance) {
        dataServiceInstance = DataService.getInstance(new MobileStorage());
    }
    return dataServiceInstance;
};
