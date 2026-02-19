import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TransactionsModule } from '../transactions.module';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { getQueueToken } from '@nestjs/bullmq';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ExecutionContext } from '@nestjs/common';
import { TransactionsService } from '../transactions.service';
import { TransactionsController } from '../transactions.controller';

describe('TransactionsController (Integration)', () => {
    let app: INestApplication;

    const mockSupabaseClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
            data: { id: 'test-id', amount: 1000, status: 'completed' },
            error: null
        }),
        rpc: jest.fn().mockResolvedValue({ error: null }),
    };

    beforeAll(async () => {
        try {
            const moduleFixture: TestingModule = await Test.createTestingModule({
                controllers: [TransactionsController],
                providers: [
                    TransactionsService,
                    {
                        provide: SupabaseService,
                        useValue: { getClient: () => mockSupabaseClient }
                    },
                    {
                        provide: getQueueToken('receipt-queue'),
                        useValue: { add: jest.fn().mockResolvedValue({}) }
                    },
                    {
                        provide: getQueueToken('ml-queue'),
                        useValue: { add: jest.fn().mockResolvedValue({}) }
                    }
                ],
            })
                .overrideGuard(JwtAuthGuard)
                .useValue({
                    canActivate: (context: ExecutionContext) => {
                        const req = context.switchToHttp().getRequest();
                        req.user = { userId: 'user-123', hospitalId: 'hosp-123', role: 'agent' };
                        return true;
                    },
                })
                .overrideGuard(PermissionsGuard)
                .useValue({
                    canActivate: () => true,
                })
                .compile();

            app = moduleFixture.createNestApplication();
            app.useGlobalPipes(new ValidationPipe());
            await app.init();
        } catch (error) {
            console.error('FAILED TO INITIALIZE TEST APP:', error);
            throw error;
        }
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    it('POST /transactions should create a transaction', () => {
        return request(app.getHttpServer())
            .post('/transactions')
            .send({
                hospitalId: 'hosp-123',
                patientId: 'pat-123',
                revenueItemId: 'rev-123',
                amount: 1000,
                paymentMethod: 'cash',
            })
            .expect(201)
            .expect((res) => {
                expect(res.body.id).toBe('test-id');
                expect(res.body.status).toBe('completed');
            });
    });

    it('GET /transactions/hospital/:id should return transactions', () => {
        mockSupabaseClient.from.mockReturnThis();
        mockSupabaseClient.select.mockReturnThis();
        mockSupabaseClient.eq = jest.fn().mockReturnThis();
        mockSupabaseClient.order = jest.fn().mockResolvedValue({
            data: [{ id: 'tx-1', amount: 500 }],
            error: null
        });

        return request(app.getHttpServer())
            .get('/transactions/hospital/hosp-123')
            .expect(200)
            .expect((res) => {
                expect(Array.isArray(res.body)).toBe(true);
                expect(res.body[0].id).toBe('tx-1');
            });
    });
});
