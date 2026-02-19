import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TransactionsService {
    private readonly logger = new Logger(TransactionsService.name);

    constructor(
        private supabaseService: SupabaseService,
        @InjectQueue('receipt-queue') private receiptQueue: Queue,
        @InjectQueue('ml-queue') private mlQueue: Queue,
    ) { }

    async create(createTransactionDto: CreateTransactionDto, createdBy: string) {
        const supabase = this.supabaseService.getClient();

        // 1. Check for idempotency if offline_id is provided
        if (createTransactionDto.offlineId) {
            const { data: existing } = await supabase
                .from('transactions')
                .select('id')
                .eq('offline_id', createTransactionDto.offlineId)
                .single();

            if (existing) {
                this.logger.log(`Transaction with offline_id ${createTransactionDto.offlineId} already exists. Returning existing.`);
                return existing;
            }
        }

        // 2. Insert transaction
        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .insert([{
                hospital_id: createTransactionDto.hospitalId,
                agent_id: createdBy, // Fixed: use agent_id from schema
                payer_id: createTransactionDto.patientId, // Fixed: use payer_id from schema
                revenue_item_id: createTransactionDto.revenueItemId,
                amount: createTransactionDto.amount,
                payment_method: createTransactionDto.paymentMethod,
                client_transaction_id: createTransactionDto.offlineId || uuidv4(), // Fixed: use client_transaction_id
                status: 'completed',
            }])
            .select('*, payers(name, email), revenue_items(name), hospitals(name)')
            .single();

        if (txError) {
            this.logger.error(`Failed to create transaction: ${txError.message}`);
            throw new BadRequestException(txError.message);
        }

        // 3. Update hospital wallet balance
        const { error: walletError } = await supabase.rpc('update_wallet_balance', {
            h_id: createTransactionDto.hospitalId,
            amt: createTransactionDto.amount
        });

        if (walletError) {
            this.logger.error(`Failed to update wallet for hospital ${createTransactionDto.hospitalId}: ${walletError.message}`);
        }

        // 4. Trigger Receipt Generation Job
        await this.receiptQueue.add('generate-receipt', {
            transactionId: transaction.id,
            transaction,
        });

        // 5. Trigger Fraud Detection Job
        await this.mlQueue.add('detect-fraud', {
            transactionId: transaction.id,
            transaction,
        });

        return transaction;
    }

    async findAllByHospital(hospitalId: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('transactions')
            .select('*, patients(full_name), revenue_items(name), users(email)')
            .eq('hospital_id', hospitalId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async findOne(id: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('transactions')
            .select('*, patients(*), revenue_items(*), users(*)')
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new BadRequestException(`Transaction with ID ${id} not found`);
        }

        return data;
    }
}
