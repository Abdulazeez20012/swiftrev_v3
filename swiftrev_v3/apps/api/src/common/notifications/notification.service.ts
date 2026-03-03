import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    private resend: Resend | null = null;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('RESEND_API_KEY');
        if (apiKey) {
            this.resend = new Resend(apiKey);
        } else {
            this.logger.warn('RESEND_API_KEY is not set. Email notifications will be disabled.');
        }
    }

    async sendEmail(to: string, subject: string, html: string, attachments?: any[]): Promise<void> {
        if (!this.resend) {
            this.logger.warn(`Email to ${to} skipped — RESEND_API_KEY not configured.`);
            return;
        }

        try {
            const from = this.configService.get<string>('EMAIL_FROM', 'SwiftRev <receipts@swiftrev.com>');
            const { data, error } = await this.resend.emails.send({
                from,
                to,
                subject,
                html,
                attachments,
            });

            if (error) {
                this.logger.error(`Failed to send email: ${error.message}`);
                throw error;
            }

            this.logger.log(`Email sent successfully to ${to}. ID: ${data?.id}`);
        } catch (error) {
            this.logger.error(`Failed to send email: ${error.message}`);
            throw error;
        }
    }

    async sendSms(to: string, message: string): Promise<void> {
        // Mock SMS implementation
        this.logger.log(`[SMS MOCK] To: ${to} | Message: ${message}`);

        // In production, integrate with Twilio, Termii, or similar
        // const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
        // ...
    }
}
