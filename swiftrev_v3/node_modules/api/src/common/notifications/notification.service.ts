import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    private readonly resend: Resend;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('RESEND_API_KEY');
        this.resend = new Resend(apiKey);
    }

    async sendEmail(to: string, subject: string, html: string, attachments?: any[]): Promise<void> {
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
}
