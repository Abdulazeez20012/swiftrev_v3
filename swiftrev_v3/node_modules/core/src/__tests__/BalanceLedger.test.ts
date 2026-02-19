import { BalanceLedger } from '../BalanceLedger';
import { LedgerEntry, LedgerEntryType } from '../types';

describe('BalanceLedger', () => {
    let ledger: BalanceLedger;

    beforeEach(() => {
        ledger = new BalanceLedger();
    });

    it('should calculate balance correctly for a new patient', () => {
        const entries: LedgerEntry[] = [];
        const balance = ledger.calculateBalance(entries);
        expect(balance).toBe(0);
    });

    it('should calculate balance with debits (charges)', () => {
        const entries: LedgerEntry[] = [
            {
                id: '1',
                patientId: 'p1',
                amount: 500,
                type: LedgerEntryType.DEBIT,
                description: 'Surgery Charge',
                createdAt: new Date()
            },
            {
                id: '2',
                patientId: 'p1',
                amount: 100,
                type: LedgerEntryType.DEBIT,
                description: 'Consultation',
                createdAt: new Date()
            }
        ];
        const balance = ledger.calculateBalance(entries);
        expect(balance).toBe(600);
    });

    it('should subtract credits (payments) from the balance', () => {
        const entries: LedgerEntry[] = [
            {
                id: '1',
                patientId: 'p1',
                amount: 1000,
                type: LedgerEntryType.DEBIT,
                description: 'Major Procedure',
                createdAt: new Date()
            },
            {
                id: '2',
                patientId: 'p1',
                amount: 400,
                type: LedgerEntryType.CREDIT,
                description: 'Partial Payment',
                createdAt: new Date()
            }
        ];
        const balance = ledger.calculateBalance(entries);
        expect(balance).toBe(600);
    });

    it('should handle negative balances (overpayments/credits)', () => {
        const entries: LedgerEntry[] = [
            {
                id: '1',
                patientId: 'p1',
                amount: 100,
                type: LedgerEntryType.CREDIT,
                description: 'Pre-payment',
                createdAt: new Date()
            }
        ];
        const balance = ledger.calculateBalance(entries);
        expect(balance).toBe(-100);
    });
});
