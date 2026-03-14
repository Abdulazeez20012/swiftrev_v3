import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { HospitalScopeGuard } from './guards/hospital-scope.guard';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService): JwtModuleOptions => {
                const secret = configService.get<string>('JWT_SECRET');
                if (!secret) {
                    throw new Error('JWT_SECRET is not defined');
                }
                return {
                    secret: secret,
                    signOptions: {
                        expiresIn: '24h' // Use a literal to satisfy the type requirement
                    },
                };
            },
        }),
    ],
    providers: [AuthService, JwtStrategy, HospitalScopeGuard],
    controllers: [AuthController],
    exports: [AuthService, JwtModule, HospitalScopeGuard],
})
export class AuthModule { }
