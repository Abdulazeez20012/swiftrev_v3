import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { NotificationService } from './notification.service';
import { ReceiptService } from './receipt.service';
import { ReceiptProcessor } from './receipt.processor';
import { SupabaseModule } from '../supabase/supabase.module';

@Global()
@Module({
    imports: [
        ConfigModule,
        SupabaseModule,
        BullModule.registerQueue({
            name: 'receipt-queue',
        }),
    ],
    providers: [NotificationService, ReceiptService, ReceiptProcessor],
    exports: [NotificationService, ReceiptService, ReceiptProcessor],
})
export class NotificationsModule { }
