import type { LedgerEntry } from './types';
export declare class BalanceLedger {
    /**
     * Calculates the current balance for a patient based on ledger entries.
     * Debits (charges) increase the balance, while Credits (payments) decrease it.
     */
    calculateBalance(entries: LedgerEntry[]): number;
    /**
     * Sorts entries by date to provide a chronological history.
     */
    getHistory(entries: LedgerEntry[]): LedgerEntry[];
}
