import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'sync-queue',
        }),
        TransactionsModule,
    ],
    controllers: [SyncController],
    providers: [SyncService],
    exports: [SyncService],
})
export class SyncModule { }
