import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { SupabaseService } from '../common/supabase/supabase.service';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        private supabaseService: SupabaseService,
        private redisService: RedisService,
    ) { }

    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    async comparePasswords(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    async login(email: string, password: string) {
        const supabase = this.supabaseService.getClient();

        // 1. Find user by email
        const { data: user, error } = await supabase
            .from('users')
            .select('*, roles(name, permissions)')
            .eq('email', email)
            .single();

        if (error || !user) {
            this.logger.warn(`Login attempt failed for email: ${email}`);
            throw new UnauthorizedException('Invalid credentials');
        }

        // 2. Validate password
        const isPasswordValid = await this.comparePasswords(password, user.password_hash);
        if (!isPasswordValid) {
            this.logger.warn(`Invalid password for email: ${email}`);
            throw new UnauthorizedException('Invalid credentials');
        }

        // 3. Generate JWT
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.roles.name,
            hospitalId: user.hospital_id,
            permissions: user.roles.permissions,
        };

        const token = this.jwtService.sign(payload);

        // 4. Store session in Redis for tracking/revocation
        // TTL matches JWT expiration (24h default)
        const ttl = 24 * 60 * 60;
        await this.redisService.set(`session:${user.id}:${token.slice(-10)}`, JSON.stringify(payload), ttl);

        return {
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                role: user.roles.name,
                hospitalId: user.hospital_id,
            },
        };
    }

    async logout(userId: string, token: string) {
        await this.redisService.del(`session:${userId}:${token.slice(-10)}`);
        return { message: 'Logged out successfully' };
    }
}
