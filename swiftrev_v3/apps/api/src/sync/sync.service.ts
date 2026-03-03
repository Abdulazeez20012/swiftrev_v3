import { Injectable, Logger } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service';
import { SyncTransactionsDto } from './dto/sync-transactions.dto';

@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name);

    constructor(
        private transactionsService: TransactionsService,
    ) { }

    async syncTransactions(syncDto: SyncTransactionsDto, userId: string) {
        this.logger.log(`Starting sync for hospital ${syncDto.hospitalId} with ${syncDto.transactions.length} items`);

        const results: {
            success: { offlineId: string | undefined; id: any }[];
            failed: { offlineId: string | undefined; error: any }[];
        } = {
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

        // Queue-based post-processing disabled (Redis unavailable); log batch completion instead.
        this.logger.log(`Sync batch completed for hospital ${syncDto.hospitalId}: ${results.success.length} success, ${results.failed.length} failed.`);

        return results;
    }
}
