"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingCalculator = void 0;
class BillingCalculator {
    calculate(items) {
        let subtotal = 0;
        let taxTotal = 0;
        let discountTotal = 0;
        for (const item of items) {
            const itemSubtotal = item.unitPrice * item.quantity;
            subtotal += itemSubtotal;
            if (item.taxRecord) {
                taxTotal += (itemSubtotal * item.taxRecord) / 100;
            }
            if (item.discountAmount) {
                discountTotal += item.discountAmount;
            }
        }
        const grandTotal = subtotal + taxTotal - discountTotal;
        return {
            subtotal,
            taxTotal,
            discountTotal,
            grandTotal,
            amountPaid: 0,
            amountDue: grandTotal
        };
    }
}
exports.BillingCalculator = BillingCalculator;
