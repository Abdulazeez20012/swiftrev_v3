import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './common/supabase/supabase.module';
import { RedisModule } from './common/redis/redis.module';
import { AuditModule } from './common/audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { HospitalsModule } from './hospitals/hospitals.module';
import { DepartmentsModule } from './departments/departments.module';
import { RevenueItemsModule } from './revenue-items/revenue-items.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { TransactionsModule } from './transactions/transactions.module';
import { WalletsModule } from './wallets/wallets.module';
import { RefundsModule } from './refunds/refunds.module';
import { SyncModule } from './sync/sync.module';
import { NotificationsModule } from './common/notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { MlModule } from './common/ml/ml.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    SupabaseModule,
    RedisModule,
    AuditModule,
    AuthModule,
    HospitalsModule,
    DepartmentsModule,
    RevenueItemsModule,
    UsersModule,
    PatientsModule,
    TransactionsModule,
    WalletsModule,
    RefundsModule,
    SyncModule,
    NotificationsModule,
    ReportsModule,
    MlModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
