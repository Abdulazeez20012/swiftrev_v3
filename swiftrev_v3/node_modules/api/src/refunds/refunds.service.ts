import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateRefundDto } from './dto/create-refund.dto';
import { AuditService } from '../common/audit/audit.service';

import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class RefundsService {
    constructor(
        private supabaseService: SupabaseService,
        private auditService: AuditService,
        @InjectQueue('receipt-queue') private receiptQueue: Queue,
    ) { }

    async create(createRefundDto: CreateRefundDto, userId: string) {
        const supabase = this.supabaseService.getClient();

        // 1. Get original transaction
        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', createRefundDto.transactionId)
            .single();

        if (txError || !transaction) {
            throw new NotFoundException('Transaction not found');
        }

        // 2. Validate refund amount
        if (createRefundDto.amount > transaction.amount) {
            throw new BadRequestException('Refund amount cannot exceed original transaction amount');
        }

        // 3. Insert refund record
        const { data: refund, error: rfError } = await supabase
            .from('refunds')
            .insert([{
                transaction_id: createRefundDto.transactionId,
                hospital_id: transaction.hospital_id,
                amount: createRefundDto.amount,
                reason: createRefundDto.reason,
                status: 'pending', // Requires approval
                requested_by: userId,
            }])
            .select()
            .single();

        if (rfError) {
            throw new BadRequestException(rfError.message);
        }

        // 4. Log the action
        await this.auditService.log(
            'REFUND_REQUESTED',
            'REFUNDS',
            userId,
            transaction.hospital_id,
            { refundId: refund.id, transactionId: transaction.id }
        );

        return refund;
    }

    async findAllByHospital(hospitalId: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('refunds')
            .select('*, transactions(amount, payment_method)')
            .eq('hospital_id', hospitalId);

        return data;
    }

    async approve(id: string, userId: string) {
        const supabase = this.supabaseService.getClient();

        const { data: refund, error: rfError } = await supabase
            .from('refunds')
            .select('*')
            .eq('id', id)
            .single();

        if (rfError || !refund) {
            throw new NotFoundException('Refund request not found');
        }

        // Atomic update: Mark refund approved and deduct from hospital wallet
        // Using RPC for safety
        const { error: walletError } = await supabase.rpc('process_refund', {
            r_id: id,
            approver_id: userId
        });

        if (walletError) {
            throw new BadRequestException(walletError.message);
        }

        await this.auditService.log(
            'REFUND_APPROVED',
            'REFUNDS',
            userId,
            refund.hospital_id,
            { refundId: id }
        );

        // 5. Trigger Notification for Refund
        await supabase
            .from('transactions')
            .select('*, patients(full_name, email), hospitals(name)')
            .eq('id', refund.transaction_id)
            .single()
            .then(async ({ data: tx }) => {
                if (tx?.patients?.email) {
                    // Reuse the receipt-queue for email notifications
                    const queue = (this as any).receiptQueue; // I need to inject it
                    if (queue) {
                        await queue.add('send-refund-email', {
                            to: tx.patients.email,
                            transaction: tx,
                            refundAmount: refund.amount,
                        });
                    }
                }
            });

        return { message: 'Refund approved and wallet updated' };
    }
}
