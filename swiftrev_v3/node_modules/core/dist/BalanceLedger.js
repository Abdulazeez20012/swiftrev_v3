"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceLedger = void 0;
const types_1 = require("./types");
class BalanceLedger {
    /**
     * Calculates the current balance for a patient based on ledger entries.
     * Debits (charges) increase the balance, while Credits (payments) decrease it.
     */
    calculateBalance(entries) {
        return entries.reduce((balance, entry) => {
            if (entry.type === types_1.LedgerEntryType.DEBIT) {
                return balance + entry.amount;
            }
            else {
                return balance - entry.amount;
            }
        }, 0);
    }
    /**
     * Sorts entries by date to provide a chronological history.
     */
    getHistory(entries) {
        return [...entries].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }
}
exports.BalanceLedger = BalanceLedger;
