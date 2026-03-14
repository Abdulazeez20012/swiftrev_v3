import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { ReceiptService } from './receipt.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { BullModule } from '@nestjs/bullmq';
import { ReceiptProcessor } from './receipt.processor';

@Global()
@Module({
    imports: [
        ConfigModule,
        SupabaseModule,
        /*
        BullModule.registerQueue({
            name: 'receipt-queue',
        }),
        */
    ],
    providers: [NotificationService, ReceiptService/*, ReceiptProcessor*/],
    exports: [NotificationService, ReceiptService/*, BullModule*/],
})
export class NotificationsModule { }
