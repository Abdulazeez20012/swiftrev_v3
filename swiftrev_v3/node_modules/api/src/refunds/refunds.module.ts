import { Module } from '@nestjs/common';
import { RefundsService } from './refunds.service';
import { RefundsController } from './refunds.controller';
import { BullModule } from '@nestjs/bullmq';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'receipt-queue',
        }),
    ],
    controllers: [RefundsController],
    providers: [RefundsService],
})
export class RefundsModule { }
