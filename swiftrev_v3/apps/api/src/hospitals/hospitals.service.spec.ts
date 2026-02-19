import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { HospitalsService } from './hospitals.service';
import { SupabaseService } from '../common/supabase/supabase.service';

describe('HospitalsService', () => {
    let service: HospitalsService;
    let supabaseService: SupabaseService;

    const mockHospital = {
        id: 'hosp-123',
        name: 'General Hospital',
        address: '123 Main St',
        contact_info: 'contact@hospital.com',
        status: 'active',
    };

    const mockSupabaseClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        single: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HospitalsService,
                {
                    provide: SupabaseService,
                    useValue: { getClient: () => mockSupabaseClient },
                },
            ],
        }).compile();

        service = module.get<HospitalsService>(HospitalsService);
        supabaseService = module.get<SupabaseService>(SupabaseService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should successfully create a hospital', async () => {
            const dto = { name: 'New Hospital', address: 'Address', contactInfo: 'Info' };
            mockSupabaseClient.single.mockResolvedValueOnce({ data: mockHospital, error: null });

            const result = await service.create(dto);

            expect(result).toEqual(mockHospital);
            expect(mockSupabaseClient.insert).toHaveBeenCalled();
        });

        it('should throw BadRequestException on error', async () => {
            mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: { message: 'Error' } });
            await expect(service.create({ name: 'Hosp' } as any)).rejects.toThrow(BadRequestException);
        });
    });

    describe('findOne', () => {
        it('should return a hospital if found', async () => {
            mockSupabaseClient.single.mockResolvedValueOnce({ data: mockHospital, error: null });

            const result = await service.findOne('hosp-123');

            expect(result).toEqual(mockHospital);
        });

        it('should throw NotFoundException if hospital not found', async () => {
            mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
            await expect(service.findOne('wrong-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should successfully update a hospital', async () => {
            const dto = { name: 'Updated Name' };
            mockSupabaseClient.single.mockResolvedValueOnce({ data: { ...mockHospital, name: 'Updated Name' }, error: null });

            const result = await service.update('hosp-123', dto);

            expect(result.name).toBe('Updated Name');
            expect(mockSupabaseClient.update).toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        it('should successfully remove a hospital', async () => {
            mockSupabaseClient.delete.mockReturnThis();
            mockSupabaseClient.eq.mockResolvedValueOnce({ error: null });

            const result = await service.remove('hosp-123');

            expect(result).toEqual({ message: 'Hospital removed successfully' });
        });
    });
});
