import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class ClaimsService {
    private readonly logger = new Logger(ClaimsService.name);

    constructor(private supabaseService: SupabaseService) { }

    async findPendingClaims(hospitalId: string, limit: number = 20, offset: number = 0) {
        const supabase = this.supabaseService.getClient();

        const { data, error, count } = await supabase
            .from('transactions')
            .select('*, patients(full_name), insurance_providers(name), revenue_items(name)', { count: 'exact' })
            .eq('hospital_id', hospitalId)
            .not('insurance_provider_id', 'is', null)
            .eq('settlement_status', 'pending')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            throw new BadRequestException(error.message);
        }

        return { data, count };
    }

    async settleClaim(transactionId: string, reference: string) {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('transactions')
            .update({
                settlement_status: 'settled',
                settlement_date: new Date().toISOString(),
                settlement_reference: reference
            })
            .eq('id', transactionId)
            .select()
            .single();

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async rejectClaim(transactionId: string, reason: string) {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('transactions')
            .update({
                settlement_status: 'rejected',
                settlement_date: new Date().toISOString(),
                settlement_reference: reason
            })
            .eq('id', transactionId)
            .select()
            .single();

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async getClaimById(transactionId: string) {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('transactions')
            .select('*, patients(full_name), insurance_providers(name), revenue_items(name)')
            .eq('id', transactionId)
            .single();

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async getStats(hospitalId: string) {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('transactions')
            .select('amount, settlement_status')
            .eq('hospital_id', hospitalId)
            .not('insurance_provider_id', 'is', null);

        if (error) {
            throw new BadRequestException(error.message);
        }

        const stats = {
            totalPending: 0,
            countPending: 0,
            totalSettled: 0,
            countSettled: 0
        };

        data.forEach(tx => {
            if (tx.settlement_status === 'pending') {
                stats.totalPending += tx.amount;
                stats.countPending++;
            } else if (tx.settlement_status === 'settled') {
                stats.totalSettled += tx.amount;
                stats.countSettled++;
            }
        });

        return stats;
    }
}
