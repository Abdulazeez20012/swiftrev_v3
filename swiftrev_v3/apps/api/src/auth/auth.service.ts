import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
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

    async login(emailInput: string, passwordInput: string) {
        const email = emailInput.trim().toLowerCase();
        const password = passwordInput;
        const supabase = this.supabaseService.getClient();

        // 1. Authenticate with Supabase Auth
        // We use a temporary client for authentcation to avoid polluting the singleton service role client
        const tempClient = createClient(
            this.configService.get<string>('SUPABASE_URL')!,
            this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
            { auth: { persistSession: false } }
        );

        const { data: authData, error: authError } = await tempClient.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            this.logger.warn(`Supabase Auth failed for email: ${email} - ${authError.message}`);

            // Optional: fallback to manual check for legacy users if needed
            // For now, we prioritize Supabase Auth
            throw new UnauthorizedException('Invalid credentials');
        }

        // 2. Find user in our public users table to get roles and hospital info
        const { data: user, error: dbError } = await supabase
            .from('users')
            .select('*, roles(name, permissions)')
            .eq('email', email)
            .maybeSingle();

        if (dbError) {
            this.logger.error(`Database error during user profile lookup for ${email}: ${dbError.message}`);
            throw new UnauthorizedException('Authentication service is temporarily unavailable');
        }

        if (!user) {
            this.logger.error(`User ${email} authenticated via Supabase but lookup in public.users failed. This usually means the user was manually created in Auth without a public profile.`);
            throw new UnauthorizedException('User profile not found. Please ensure you have a registered profile in the management system.');
        }

        // 3. Generate JWT for internal app use
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.roles.name,
            hospitalId: user.hospital_id,
            permissions: user.roles.permissions,
        };

        const token = this.jwtService.sign(payload);

        // 4. Store session in Redis (optional/graceful failure if Redis is down)
        try {
            const ttl = 24 * 60 * 60;
            await this.redisService.set(`session:${user.id}:${token.slice(-10)}`, JSON.stringify(payload), ttl);
        } catch (error) {
            this.logger.warn(`Failed to store session in Redis: ${error.message}. Login proceeding without Redis session tracking.`);
        }

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
