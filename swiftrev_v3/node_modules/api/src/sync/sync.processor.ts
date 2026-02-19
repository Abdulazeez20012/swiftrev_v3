import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('sync-queue')
export class SyncProcessor extends WorkerHost {
    private readonly logger = new Logger(SyncProcessor.name);

    async process(job: Job<any, any, string>): Promise<any> {
        switch (job.name) {
            case 'process-synced-batch':
                this.logger.log(`Processing synced batch for hospital ${job.data.hospitalId}...`);
                // Here we can trigger PDF receipt generation, email notifications, etc.
                break;
            default:
                this.logger.warn(`Unknown job name: ${job.name}`);
        }
    }
}
