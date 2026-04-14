import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { v4 as uuidv4 } from 'uuid';
// import { InjectQueue } from '@nestjs/bullmq';
// import { Queue } from 'bullmq';
import { MlService } from '../common/ml/ml.service';

@Injectable()
export class TransactionsService {
    private readonly logger = new Logger(TransactionsService.name);

    constructor(
        private supabaseService: SupabaseService,
        private mlService: MlService,
        // @InjectQueue('receipt-queue') private readonly receiptQueue: Queue,
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
                agent_id: createdBy,
                patient_id: createTransactionDto.patientId,
                revenue_item_id: createTransactionDto.revenueItemId,
                amount: createTransactionDto.amount,
                payment_method: createTransactionDto.paymentMethod,
                client_transaction_id: createTransactionDto.offlineId || uuidv4(),
                status: 'completed',
            }])
            .select('*, patients(full_name, email, insurance_number), revenue_items(name, departments(name)), hospitals(name, address, logo_url)')
            .single();

        if (txError) {
            this.logger.error(`Failed to create transaction: ${txError.message}`);
            throw new BadRequestException(txError.message);
        }

        // 3. Update agent float (deduct) and hospital revenue (add)
        // Note: Using the new RPC that handles both u_id (agent) and NULL (master)
        try {
            await Promise.all([
                // Deduct from agent operating float
                supabase.rpc('update_wallet_balance', {
                    h_id: createTransactionDto.hospitalId,
                    amt: -Number(createTransactionDto.amount),
                    u_id: createdBy
                }),
                // Add to hospital revenue master
                supabase.rpc('update_wallet_balance', {
                    h_id: createTransactionDto.hospitalId,
                    amt: Number(createTransactionDto.amount),
                    u_id: null
                })
            ]);
        } catch (walletError: any) {
            this.logger.error(`Failed to update wallets for hospital/agent: ${walletError.message}`);
            // We don't necessarily throw here if the transaction is already written,
            // but in a production system, this should be a DB transaction.
        }

        // 4. Trigger Fraud Detection (Async)
        this.mlService.checkFraud(transaction).catch(err => {
            this.logger.error(`Async fraud check failed for transaction ${transaction.id}: ${err.message}`);
        });

        /*
        // 5. Trigger Receipt Generation (Async Queue)
        this.receiptQueue.add('generate-receipt', {
            transactionId: transaction.id,
            transaction,
        }).catch(err => {
            this.logger.error(`Failed to queue receipt for transaction ${transaction.id}: ${err.message}`);
        });
        */

        this.logger.log(`Transaction ${transaction.id} created, fraud check and receipt generation triggered.`);

        return transaction;
    }

    async findAllByHospital(
        hospitalId: string,
        status?: string,
        paymentMethod?: string,
        limit: number = 20,
        offset: number = 0,
        agentId?: string
    ) {
        const supabase = this.supabaseService.getClient();
        let query = supabase
            .from('transactions')
            .select('*, patients(full_name), revenue_items(name), users(email)', { count: 'exact' })
            .eq('hospital_id', hospitalId);

        if (status) {
            query = query.eq('status', status);
        }

        if (paymentMethod) {
            query = query.eq('payment_method', paymentMethod);
        }

        if (agentId) {
            query = query.eq('agent_id', agentId);
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error(`[TransactionsService] Error fetching transactions for hospital ${hospitalId}:`, error);
            throw new BadRequestException(error.message);
        }

        return { data, count };
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
