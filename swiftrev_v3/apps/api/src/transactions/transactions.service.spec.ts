import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { BadRequestException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { SupabaseService } from '../common/supabase/supabase.service';

describe('TransactionsService', () => {
    let service: TransactionsService;
    let supabaseService: SupabaseService;
    let receiptQueue: any;
    let mlQueue: any;

    const mockTransaction = {
        id: 'tx-123',
        amount: 5000,
        hospital_id: 'hosp-123',
        patient_id: 'pat-123',
        revenue_item_id: 'rev-123',
        payment_method: 'card',
    };

    const mockSupabaseClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn(),
        rpc: jest.fn(),
        order: jest.fn().mockReturnThis(),
    };

    const mockQueue = {
        add: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransactionsService,
                {
                    provide: SupabaseService,
                    useValue: { getClient: () => mockSupabaseClient },
                },
                {
                    provide: getQueueToken('receipt-queue'),
                    useValue: mockQueue,
                },
                {
                    provide: getQueueToken('ml-queue'),
                    useValue: mockQueue,
                },
            ],
        }).compile();

        service = module.get<TransactionsService>(TransactionsService);
        supabaseService = module.get<SupabaseService>(SupabaseService);
        receiptQueue = module.get(getQueueToken('receipt-queue'));
        mlQueue = module.get(getQueueToken('ml-queue'));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        const createDto = {
            hospitalId: 'hosp-123',
            patientId: 'pat-123',
            revenueItemId: 'rev-123',
            amount: 5000,
            paymentMethod: 'card' as any,
        };

        it('should successfully create a transaction and enqueue jobs', async () => {
            // Mock flow
            mockSupabaseClient.single.mockResolvedValueOnce({ data: mockTransaction, error: null }); // Insert
            mockSupabaseClient.rpc.mockResolvedValueOnce({ error: null }); // update_wallet

            const result = await service.create(createDto, 'user-123');

            expect(result).toEqual(mockTransaction);
            expect(mockSupabaseClient.insert).toHaveBeenCalled();
            expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('update_wallet_balance', {
                h_id: createDto.hospitalId,
                amt: createDto.amount,
            });
            expect(receiptQueue.add).toHaveBeenCalledWith('generate-receipt', expect.any(Object));
            expect(mlQueue.add).toHaveBeenCalledWith('detect-fraud', expect.any(Object));
        });

        it('should return existing transaction if offlineId matches (idempotency)', async () => {
            const dtoWithOfflineId = { ...createDto, offlineId: 'off-123' };
            mockSupabaseClient.single.mockResolvedValueOnce({ data: { id: 'tx-existing' }, error: null }); // check exists

            const result = await service.create(dtoWithOfflineId, 'user-123');

            expect(result).toEqual({ id: 'tx-existing' });
            expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException if insert fails', async () => {
            mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: { message: 'DB Error' } });

            await expect(service.create(createDto, 'user-123')).rejects.toThrow(BadRequestException);
        });
    });

    describe('findAllByHospital', () => {
        it('should return all transactions for a hospital', async () => {
            // Corrected chained mock
            mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
            mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
            mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
            mockSupabaseClient.order.mockResolvedValue({ data: [mockTransaction], error: null });

            const result = await service.findAllByHospital('hosp-123');

            expect(result).toEqual([mockTransaction]);
        });
    });
});
