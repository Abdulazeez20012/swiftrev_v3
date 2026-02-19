import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { RedisService } from '../common/redis/redis.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
    let service: AuthService;
    let jwtService: JwtService;
    let supabaseService: SupabaseService;
    let redisService: RedisService;

    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashedPassword',
        hospital_id: 'hosp-123',
        roles: {
            name: 'agent',
            permissions: { transactions: ['create'] },
        },
    };

    const mockSupabaseClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
    };

    const mockRedisService = {
        set: jest.fn(),
        del: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn().mockReturnValue('mock-token'),
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: JwtService, useValue: mockJwtService },
                { provide: ConfigService, useValue: mockConfigService },
                { provide: SupabaseService, useValue: { getClient: () => mockSupabaseClient } },
                { provide: RedisService, useValue: mockRedisService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        jwtService = module.get<JwtService>(JwtService);
        supabaseService = module.get<SupabaseService>(SupabaseService);
        redisService = module.get<RedisService>(RedisService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('login', () => {
        it('should successfully login a user with valid credentials', async () => {
            // Setup
            mockSupabaseClient.single.mockResolvedValue({ data: mockUser, error: null });
            jest.spyOn(service, 'comparePasswords').mockResolvedValue(true);

            // Execute
            const result = await service.login('test@example.com', 'password123');

            // Assert
            expect(result).toEqual({
                access_token: 'mock-token',
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    role: mockUser.roles.name,
                    hospitalId: mockUser.hospital_id,
                },
            });
            expect(redisService.set).toHaveBeenCalled();
        });

        it('should throw UnauthorizedException if user not found', async () => {
            // Setup
            mockSupabaseClient.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });

            // Execute & Assert
            await expect(service.login('wrong@example.com', 'password')).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if password invalid', async () => {
            // Setup
            mockSupabaseClient.single.mockResolvedValue({ data: mockUser, error: null });
            jest.spyOn(service, 'comparePasswords').mockResolvedValue(false);

            // Execute & Assert
            await expect(service.login('test@example.com', 'wrongpassword')).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('logout', () => {
        it('should delete the session from Redis', async () => {
            // Execute
            await service.logout('user-123', 'mock-token-abc');

            // Assert
            expect(redisService.del).toHaveBeenCalledWith(expect.stringContaining('session:user-123:'));
        });
    });

    describe('password hashing', () => {
        it('should hash a password', async () => {
            const password = 'plainPassword';
            const hash = await service.hashPassword(password);
            expect(hash).toBeDefined();
            expect(hash).not.toEqual(password);
        });

        it('should correctly compare passwords', async () => {
            const password = 'plainPassword';
            const hash = await bcrypt.hash(password, 10);
            const isValid = await service.comparePasswords(password, hash);
            const isInvalid = await service.comparePasswords('wrong', hash);

            expect(isValid).toBe(true);
            expect(isInvalid).toBe(false);
        });
    });
});
