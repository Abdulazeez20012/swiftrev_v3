import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ReceiptService } from './receipt.service';
import { NotificationService } from './notification.service';
import { SupabaseService } from '../supabase/supabase.service';

@Processor('receipt-queue')
export class ReceiptProcessor extends WorkerHost {
    private readonly logger = new Logger(ReceiptProcessor.name);

    constructor(
        private readonly receiptService: ReceiptService,
        private readonly notificationService: NotificationService,
        private readonly supabaseService: SupabaseService,
        @InjectQueue('receipt-queue') private readonly receiptQueue: Queue,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        const { transactionId, transaction } = job.data;

        switch (job.name) {
            case 'generate-receipt':
                this.logger.log(`Generating receipt for transaction ${transactionId}...`);

                // 1. Prepare data for template
                const receiptData = {
                    id: transaction.id.split('-')[0].toUpperCase(),
                    hospitalName: transaction.hospitals?.name || 'SwiftRev Partner Hospital',
                    hospitalLogo: transaction.hospitals?.logo_url,
                    hospitalAddress: transaction.hospitals?.address || 'Medical Center Address',
                    date: new Date(transaction.created_at).toLocaleString(),
                    patientName: transaction.patients?.full_name || 'Valued Patient',
                    paymentMethod: transaction.payment_method.toUpperCase(),
                    revenueItemName: transaction.revenue_items?.name,
                    departmentName: transaction.revenue_items?.departments?.name || 'General Services',
                    amount: transaction.amount.toLocaleString(),
                };

                // 2. Generate PDF Buffer
                const pdfBuffer = await this.receiptService.generateReceiptPdf(receiptData);

                // 3. Upload to Supabase Storage
                const supabase = this.supabaseService.getClient();
                const fileName = `${transactionId}.pdf`;
                const { error: uploadError } = await supabase.storage
                    .from('receipts')
                    .upload(fileName, pdfBuffer, {
                        contentType: 'application/pdf',
                        upsert: true,
                    });

                if (uploadError) {
                    throw new Error(`Failed to upload receipt: ${uploadError.message}`);
                }

                // 4. Update transaction with receipt URL
                const { data: publicUrlData } = supabase.storage
                    .from('receipts')
                    .getPublicUrl(fileName);

                await supabase
                    .from('transactions')
                    .update({ receipt_url: publicUrlData.publicUrl })
                    .eq('id', transactionId);

                this.logger.log(`Receipt generated and stored for transaction ${transactionId}`);

                // 5. Trigger Email Job
                if (transaction.patients?.email) {
                    await this.receiptQueue.add('send-receipt-email', {
                        to: transaction.patients.email,
                        transaction,
                        pdfBuffer: pdfBuffer.toString('base64'),
                    });
                }

                // 6. Trigger SMS Job
                if (transaction.patients?.phone) {
                    await this.receiptQueue.add('send-receipt-sms', {
                        to: transaction.patients.phone,
                        transaction,
                    });
                }
                break;

            case 'send-receipt-email':
                this.logger.log(`Sending receipt email to ${job.data.to}...`);

                const emailHtml = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Your Digital Receipt from ${transaction.hospitals?.name}</h2>
            <p>Hello ${transaction.patients?.full_name},</p>
            <p>Thank you for your payment. Please find your digital receipt attached to this email.</p>
            <p><strong>Transaction ID:</strong> ${transaction.id.split('-')[0].toUpperCase()}</p>
            <p><strong>Amount:</strong> ₦${transaction.amount.toLocaleString()}</p>
            <br/>
            <p>Securely delivered by SwiftRev HERMS.</p>
          </div>
        `;

                await this.notificationService.sendEmail(
                    job.data.to,
                    `Receipt for your payment at ${transaction.hospitals?.name || 'Hospital'}`,
                    emailHtml,
                    [
                        {
                            filename: `receipt-${transactionId.split('-')[0]}.pdf`,
                            content: Buffer.from(job.data.pdfBuffer, 'base64'),
                        },
                    ],
                );
                break;

            case 'send-receipt-sms':
                this.logger.log(`Sending receipt SMS to ${job.data.to}...`);
                const smsMessage = `Receipt from ${transaction.hospitals?.name}: ₦${transaction.amount.toLocaleString()} paid. Ref: ${transaction.id.split('-')[0].toUpperCase()}. View: ${transaction.receipt_url}`;
                await this.notificationService.sendSms(job.data.to, smsMessage);
                break;

            case 'send-refund-email':
                this.logger.log(`Sending refund notification email to ${job.data.to}...`);

                const refundHtml = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #ef4444;">Refund Processed Successfully</h2>
            <p>Hello ${transaction.patients?.full_name},</p>
            <p>A refund has been issued for your transaction at ${transaction.hospitals?.name}.</p>
            <p><strong>Transaction ID:</strong> ${transaction.id.split('-')[0].toUpperCase()}</p>
            <p><strong>Refund Amount:</strong> ₦${job.data.refundAmount.toLocaleString()}</p>
            <br/>
            <p>If you have any questions, please contact the hospital administration.</p>
            <br/>
            <p>Securely delivered by SwiftRev HERMS.</p>
          </div>
        `;

                await this.notificationService.sendEmail(
                    job.data.to,
                    `Refund Confirmation - ${transaction.hospitals?.name || 'Hospital'}`,
                    refundHtml,
                );
                break;

            default:
                this.logger.warn(`Unknown job name: ${job.name}`);
        }
    }
}
