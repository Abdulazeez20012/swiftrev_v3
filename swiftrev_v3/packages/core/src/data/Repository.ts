import type { DataResponse } from '../types';

export interface BaseRepository<T> {
    getAll(): Promise<DataResponse<T[]>>;
    getById(id: string): Promise<DataResponse<T>>;
    create(item: Omit<T, 'id' | 'created_at'>): Promise<DataResponse<T>>;
    update(id: string, item: Partial<T>): Promise<DataResponse<T>>;
    delete(id: string): Promise<DataResponse<boolean>>;
    subscribe(callback: (data: T[]) => void): () => void;
}

export interface PatientRepository extends BaseRepository<any> {
    // Specific patient methods if needed
}

export interface TreatmentRepository extends BaseRepository<any> {
    getByPatientId(patientId: string): Promise<DataResponse<any[]>>;
}
