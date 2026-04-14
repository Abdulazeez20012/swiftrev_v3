import { Platform } from 'react-native';

/**
 * ESC/POS Command Constants for Thermal Printers
 */
const ESC = '\x1b';
const GS = '\x1d';
const LINE_FEED = '\x0a';
const CENTER_ALIGN = ESC + 'a' + '\x01';
const LEFT_ALIGN = ESC + 'a' + '\x00';
const RIGHT_ALIGN = ESC + 'a' + '\x02';
const BOLD_ON = ESC + 'E' + '\x01';
const BOLD_OFF = ESC + 'E' + '\x00';
const DOUBLE_HEIGHT = ESC + '!' + '\x10';
const DOUBLE_WIDTH = ESC + '!' + '\x20';
const RESET = ESC + '!0';

export interface ReceiptData {
    hospitalName: string;
    hospitalAddress: string;
    patientName: string;
    serviceName: string;
    amount: number;
    transactionId: string;
    date: string;
    paymentMethod: string;
}

export class ThermalPrinter {
    /**
     * Formats receipt data into ESC/POS text commands
     * @param data Transaction data
     * @param width 58 (default) or 80 mm
     */
    static formatReceipt(data: ReceiptData, width: 58 | 80 = 58): string {
        const charWidth = width === 58 ? 32 : 48; // Standard character widths for 58mm/80mm
        const separator = '-'.repeat(charWidth);

        let receipt = '';

        // Header
        receipt += CENTER_ALIGN + BOLD_ON + DOUBLE_HEIGHT + data.hospitalName.toUpperCase() + LINE_FEED;
        receipt += RESET + CENTER_ALIGN + data.hospitalAddress + LINE_FEED;
        receipt += separator + LINE_FEED;

        // Title
        receipt += BOLD_ON + 'OFFICIAL MEDICAL RECEIPT' + BOLD_OFF + LINE_FEED;
        receipt += 'Ref: ' + data.transactionId.toUpperCase() + LINE_FEED;
        receipt += 'Date: ' + data.date + LINE_FEED;
        receipt += separator + LINE_FEED;

        // Body
        receipt += LEFT_ALIGN + 'PATIENT: ' + data.patientName + LINE_FEED;
        receipt += 'SERVICE: ' + data.serviceName + LINE_FEED;
        receipt += separator + LINE_FEED;

        // Pricing
        receipt += RIGHT_ALIGN + BOLD_ON + 'TOTAL: NGN ' + data.amount.toLocaleString() + BOLD_OFF + LINE_FEED;
        receipt += RIGHT_ALIGN + 'Method: ' + data.paymentMethod + LINE_FEED;
        receipt += separator + LINE_FEED;

        // Footer
        receipt += CENTER_ALIGN + 'Powered by SwiftRev HERMS' + LINE_FEED;
        receipt += 'Verified Digital Receipt' + LINE_FEED;
        receipt += LINE_FEED + LINE_FEED + LINE_FEED; // Extra padding for tear-off

        return receipt;
    }

    /**
     * Placeholder for actual Bluetooth printing implementation
     * Note: Requires react-native-bluetooth-escpos-printer or similar
     */
    static async printReceipt(data: ReceiptData) {
        if (Platform.OS === 'web') {
            console.log('Printing is not supported on web');
            return;
        }

        const formattedText = this.formatReceipt(data);
        console.log('Sending to printer:', formattedText);

        // Usage for user:
        // import { BluetoothEscposPrinter } from 'react-native-bluetooth-escpos-printer'
        // await BluetoothEscposPrinter.printText(formattedText, {});
    }
}
