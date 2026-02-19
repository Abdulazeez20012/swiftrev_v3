import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'receipt-queue',
        }),
        BullModule.registerQueue({
            name: 'ml-queue',
        }),
    ],
    controllers: [TransactionsController],
    providers: [TransactionsService],
    exports: [TransactionsService, BullModule],
})
export class TransactionsModule { }
