import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TransactionsService } from '../transactions/transactions.service';
import { SyncTransactionsDto } from './dto/sync-transactions.dto';

@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name);

    constructor(
        private transactionsService: TransactionsService,
        @InjectQueue('sync-queue') private syncQueue: Queue,
    ) { }

    async syncTransactions(syncDto: SyncTransactionsDto, userId: string) {
        this.logger.log(`Starting sync for hospital ${syncDto.hospitalId} with ${syncDto.transactions.length} items`);

        const results = {
            success: [],
            failed: [],
        };

        // Process transactions sequentially or in parallel?
        // Sequential is safer for wallet updates in this basic implementation
        for (const txData of syncDto.transactions) {
            try {
                const result = await this.transactionsService.create(txData, userId);
                results.success.push({ offlineId: txData.offlineId, id: result.id });
            } catch (error) {
                this.logger.error(`Sync failed for item ${txData.offlineId}: ${error.message}`);
                results.failed.push({ offlineId: txData.offlineId, error: error.message });
            }
        }

        // Add sync completion job to queue for any post-sync processing (e.g., receipt generation)
        await this.syncQueue.add('process-synced-batch', {
            hospitalId: syncDto.hospitalId,
            userId,
            batchSize: results.success.length,
        });

        return results;
    }
}
