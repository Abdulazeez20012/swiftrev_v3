import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { v4 as uuidv4 } from 'uuid';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MlService } from '../common/ml/ml.service';

@Injectable()
export class TransactionsService {
    private readonly logger = new Logger(TransactionsService.name);

    constructor(
        private supabaseService: SupabaseService,
        private mlService: MlService,
        @InjectQueue('receipt-queue') private readonly receiptQueue: Queue,
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
                payer_id: createTransactionDto.patientId,
                revenue_item_id: createTransactionDto.revenueItemId,
                amount: createTransactionDto.amount,
                payment_method: createTransactionDto.paymentMethod,
                client_transaction_id: createTransactionDto.offlineId || uuidv4(),
                insurance_provider_id: createTransactionDto.insuranceProviderId,
                auth_code: createTransactionDto.authCode,
                proof_image_url: createTransactionDto.proofImageUrl,
                status: 'completed',
            }])
            .select('*, patients(full_name, email, insurance_number), insurance_providers(name), revenue_items(name), hospitals(name)')
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

        // 4. Trigger Fraud Detection (Async)
        this.mlService.checkFraud(transaction).catch(err => {
            this.logger.error(`Async fraud check failed for transaction ${transaction.id}: ${err.message}`);
        });

        // 5. Trigger Receipt Generation (Async Queue)
        this.receiptQueue.add('generate-receipt', {
            transactionId: transaction.id,
            transaction,
        }).catch(err => {
            this.logger.error(`Failed to queue receipt for transaction ${transaction.id}: ${err.message}`);
        });

        this.logger.log(`Transaction ${transaction.id} created, fraud check and receipt generation triggered.`);

        return transaction;
    }

    async findAllByHospital(
        hospitalId: string,
        status?: string,
        paymentMethod?: string,
        limit: number = 20,
        offset: number = 0
    ) {
        const supabase = this.supabaseService.getClient();
        let query = supabase
            .from('transactions')
            .select('*, patients(full_name), revenue_items(name), users(email), insurance_providers(name), ml_predictions!entity_id(*)', { count: 'exact' })
            .eq('hospital_id', hospitalId)
            .eq('ml_predictions.prediction_type', 'fraud_score');

        if (status) {
            query = query.eq('status', status);
        }

        if (paymentMethod) {
            query = query.eq('payment_method', paymentMethod);
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
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
