import { BillingCalculator } from '../BillingCalculator';
import { LineItem, LineItemType } from '../types';

describe('BillingCalculator', () => {
    let calculator: BillingCalculator;

    beforeEach(() => {
        calculator = new BillingCalculator();
    });

    it('should calculate subtotal correctly for simple items', () => {
        const items: LineItem[] = [
            {
                id: '1',
                type: LineItemType.CONSULTATION,
                description: 'Doctor Visit',
                unitPrice: 100,
                quantity: 1
            },
            {
                id: '2',
                type: LineItemType.PHARMACY,
                description: 'Medicine',
                unitPrice: 50,
                quantity: 2
            }
        ];

        const summary = calculator.calculate(items);
        expect(summary.subtotal).toBe(200);
        expect(summary.grandTotal).toBe(200);
    });

    it('should apply taxes correctly', () => {
        const items: LineItem[] = [
            {
                id: '1',
                type: LineItemType.CONSULTATION,
                description: 'Doctor Visit',
                unitPrice: 100,
                quantity: 1,
                taxRecord: 10 // 10% tax
            }
        ];

        const summary = calculator.calculate(items);
        expect(summary.subtotal).toBe(100);
        expect(summary.taxTotal).toBe(10);
        expect(summary.grandTotal).toBe(110);
    });

    it('should apply flat discounts correctly', () => {
        const items: LineItem[] = [
            {
                id: '1',
                type: LineItemType.PROCEDURE,
                description: 'Surgery',
                unitPrice: 1000,
                quantity: 1,
                discountAmount: 200 // $200 off
            }
        ];

        const summary = calculator.calculate(items);
        expect(summary.subtotal).toBe(1000);
        expect(summary.discountTotal).toBe(200);
        expect(summary.grandTotal).toBe(800);
    });

    it('should handle complex mixed bills', () => {
        const items: LineItem[] = [
            {
                id: '1',
                type: LineItemType.CONSULTATION,
                description: 'Doctor Visit',
                unitPrice: 100,
                quantity: 1,
                taxRecord: 5
            },
            {
                id: '2',
                type: LineItemType.LAB_TEST,
                description: 'Blood Work',
                unitPrice: 200,
                quantity: 1,
                discountAmount: 20
            }
        ];

        const summary = calculator.calculate(items);
        // Item 1: 100 + 5 tax = 105
        // Item 2: 200 - 20 discount = 180
        // Total subtotal: 300
        // Total tax: 5
        // Total discount: 20
        // Grand Total: 285
        expect(summary.subtotal).toBe(300);
        expect(summary.taxTotal).toBe(5);
        expect(summary.discountTotal).toBe(20);
        expect(summary.grandTotal).toBe(285);
    });
});
