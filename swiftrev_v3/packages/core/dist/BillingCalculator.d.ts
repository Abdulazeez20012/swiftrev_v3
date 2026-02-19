import type { BillingSummary, LineItem } from './types';
export declare class BillingCalculator {
    calculate(items: LineItem[]): BillingSummary;
}
