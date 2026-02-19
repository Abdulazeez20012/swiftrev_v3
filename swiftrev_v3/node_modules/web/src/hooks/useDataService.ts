import { DataService } from 'core';
import { WebStorage } from '../services/WebStorage';

let dataServiceInstance: DataService | null = null;

export const useDataService = () => {
    if (!dataServiceInstance) {
        dataServiceInstance = DataService.getInstance(new WebStorage());
    }
    return dataServiceInstance;
};
