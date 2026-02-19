import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class ReceiptService {
    private readonly logger = new Logger(ReceiptService.name);

    async generateReceiptPdf(data: any): Promise<Buffer> {
        try {
            const templatePath = join(__dirname, '../../assets/templates/receipt.hbs');
            const templateContent = readFileSync(templatePath, 'utf8');
            const template = handlebars.compile(templateContent);
            const html = template(data);

            const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                headless: true,
            });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
            });

            await browser.close();
            return Buffer.from(pdf);
        } catch (error) {
            this.logger.error(`Failed to generate receipt PDF: ${error.message}`);
            throw error;
        }
    }
}
