import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { InsuranceProvidersModule } from './insurance-providers/insurance-providers.module';
import { ClaimsModule } from './claims/claims.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UploadsModule } from './uploads/uploads.module';
import { SentryModule } from '@sentry/nestjs/setup';
import { Request, Response, NextFunction } from 'express';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
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
    InsuranceProvidersModule,
    ClaimsModule,
    DashboardModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: Request, res: Response, next: NextFunction) => {
        const { method, path } = req;
        res.on('finish', () => {
          console.log(`[Request] ${method} ${path} - ${res.statusCode}`);
        });
        next();
      })
      .forRoutes('*');
  }
}
