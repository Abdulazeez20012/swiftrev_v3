import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
    private readonly logger = new Logger(RedisService.name);
    private clientInstance: Redis;

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
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });

        this.clientInstance.on('connect', () => this.logger.log('Redis connected'));
        this.clientInstance.on('error', (err) => this.logger.error('Redis error', err));

        return this.clientInstance;
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        const client = this.getClient();
        if (ttlSeconds) {
            await client.set(key, value, 'EX', ttlSeconds);
        } else {
            await client.set(key, value);
        }
    }

    async get(key: string): Promise<string | null> {
        const client = this.getClient();
        return client.get(key);
    }

    async del(key: string): Promise<void> {
        const client = this.getClient();
        await client.del(key);
    }
}
