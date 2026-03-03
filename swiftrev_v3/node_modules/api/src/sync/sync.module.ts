import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
    imports: [

        TransactionsModule,
    ],
    controllers: [SyncController],
    providers: [SyncService],
    exports: [SyncService],
})
export class SyncModule { }
