import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { MlService } from './ml.service';
import { NotificationService } from '../notifications/notification.service';

@Processor('ml-queue')
export class MlProcessor extends WorkerHost {
    private readonly logger = new Logger(MlProcessor.name);

    constructor(
        private readonly mlService: MlService,
        private readonly notificationService: NotificationService,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        const { transactionId, transaction } = job.data;

        switch (job.name) {
            case 'detect-fraud':
                this.logger.log(`Analyzing transaction ${transactionId} for fraud...`);

                try {
                    const prediction = await this.mlService.checkFraud(transaction);

                    if (prediction.is_anomaly) {
                        this.logger.warn(`Potential fraud detected for transaction ${transactionId}! Confidence: ${prediction.confidence_score}`);

                        // Trigger alert for hospital admin
                        // In a real scenario, this would send to an admin's email or a dashboard notification
                        await this.notificationService.sendEmail(
                            'admin@swiftrev.com', // Placeholder for actual admin email
                            `🚨 FRAUD ALERT: High-risk transaction detected`,
                            `
              <div style="font-family: sans-serif; padding: 20px;">
                <h2 style="color: #ef4444;">High-Risk Transaction Detected</h2>
                <p>A transaction has been flagged as suspicious by the SwiftRev AI system.</p>
                <p><strong>Transaction ID:</strong> ${transactionId.split('-')[0].toUpperCase()}</p>
                <p><strong>Amount:</strong> ₦${transaction.amount.toLocaleString()}</p>
                <p><strong>Confidence Score:</strong> ${(prediction.confidence_score * 100).toFixed(2)}%</p>
                <p><strong>Features Flagged:</strong> ${JSON.stringify(prediction.features_used)}</p>
                <br/>
                <p><a href="https://app.swiftrev.com/admin/transactions/${transactionId}" style="background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Transaction</a></p>
              </div>
              `
                        );
                    }
                } catch (error) {
                    this.logger.error(`Fraud detection failed for transaction ${transactionId}: ${error.message}`);
                    throw error;
                }
                break;

            default:
                this.logger.warn(`Unknown job name: ${job.name}`);
        }
    }
}
