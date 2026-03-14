import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
    private readonly logger = new Logger(RedisService.name);
    private clientInstance: Redis | null = null;
    private redisAvailable = false;

    constructor(private configService: ConfigService) { }

    getClient(): Redis {
        if (this.clientInstance) {
            return this.clientInstance;
        }

        const host = this.configService.get<string>('REDIS_HOST', 'localhost');
        const port = this.configService.get<number>('REDIS_PORT', 6379);
        const password = this.configService.get<string>('REDIS_PASSWORD');

        this.clientInstance = new Redis({
            host,
            port,
            password,
            enableOfflineQueue: false,
            lazyConnect: false,
            retryStrategy: () => {
                this.logger.warn('Redis unavailable. Disabling Redis for this session.');
                this.redisAvailable = false;
                return null; // Stop retrying immediately
            },
        });

        this.clientInstance.on('connect', () => {
            this.redisAvailable = true;
            this.logger.log('Redis connected');
        });
        this.clientInstance.on('error', () => { this.redisAvailable = false; }); // Suppress stack trace flood

        return this.clientInstance;
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        try {
            const client = this.getClient();
            if (!client || !this.redisAvailable) return;
            if (ttlSeconds) {
                await client.set(key, value, 'EX', ttlSeconds);
            } else {
                await client.set(key, value);
            }
        } catch { /* Redis unavailable, silently skip */ }
    }

    async get(key: string): Promise<string | null> {
        try {
            const client = this.getClient();
            if (!client || !this.redisAvailable) return null;
            return client.get(key);
        } catch { return null; }
    }

    async del(key: string): Promise<void> {
        try {
            const client = this.getClient();
            if (!client || !this.redisAvailable) return;
            await client.del(key);
        } catch { /* Redis unavailable, silently skip */ }
    }
}
