import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { MlService } from './ml.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('MlService', () => {
    let service: MlService;
    let httpService: HttpService;
    let supabaseService: SupabaseService;

    const mockTransaction = {
        id: 'tx-123',
        amount: 5000,
        hospital_id: 'hosp-123',
        payment_method: 'card',
        created_at: '2026-02-17',
    };

    const mockPrediction = {
        is_anomaly: false,
        confidence_score: 0.95,
    };

    const mockSupabaseClient = {
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue({ error: null }),
    };

    const mockHttpService = {
        post: jest.fn().mockReturnValue(of({ data: mockPrediction })),
        get: jest.fn().mockReturnValue(of({ data: [{ ds: '2026-02-17', yhat: 1000 }] })),
    };

    const mockConfigService = {
        get: jest.fn().mockReturnValue('http://ai-service:8000'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MlService,
                { provide: HttpService, useValue: mockHttpService },
                { provide: ConfigService, useValue: mockConfigService },
                { provide: SupabaseService, useValue: { getClient: () => mockSupabaseClient } },
            ],
        }).compile();

        service = module.get<MlService>(MlService);
        httpService = module.get<HttpService>(HttpService);
        supabaseService = module.get<SupabaseService>(SupabaseService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('checkFraud', () => {
        it('should call the AI service and save prediction to DB', async () => {
            const result = await service.checkFraud(mockTransaction);

            expect(httpService.post).toHaveBeenCalledWith(expect.stringContaining('/fraud/check'), expect.any(Object));
            expect(mockSupabaseClient.from).toHaveBeenCalledWith('ml_predictions');
            expect(mockSupabaseClient.insert).toHaveBeenCalled();
            expect(result).toEqual(mockPrediction);
        });
    });

    describe('getRevenueForecast', () => {
        it('should return forecast data from AI service', async () => {
            const result = await service.getRevenueForecast('hosp-123');

            expect(httpService.get).toHaveBeenCalledWith(expect.stringContaining('/forecast/revenue/hosp-123'));
            expect(result).toBeDefined();
        });
    });

    describe('getRecommendations', () => {
        it('should return recommendations from AI service', async () => {
            mockHttpService.get.mockReturnValueOnce(of({ data: [{ agent_id: 'A1', suggested_topup: 5000 }] }));

            const result = await service.getRecommendations('hosp-123');

            expect(httpService.get).toHaveBeenCalledWith(expect.stringContaining('/recommendations/hosp-123'));
            expect(result).toHaveLength(1);
        });
    });
});
