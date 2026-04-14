import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class WalletsService {
    constructor(private supabaseService: SupabaseService) { }

    async findByHospital(hospitalId: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('wallets')
            .select('*')
            .eq('hospital_id', hospitalId)
            .order('wallet_type', { ascending: false }); // Hospital first

        if (error) {
            console.error(`[WalletsService] Error fetching wallets for hospital ${hospitalId}:`, error);
            throw new BadRequestException(error.message);
        }

        return data || [];
    }

    async getTransactionHistory(hospitalId: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('hospital_id', hospitalId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async topUp(hospitalId: string, amount: number, agentId?: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase.rpc('update_wallet_balance', {
            h_id: hospitalId,
            amt: amount,
            u_id: agentId || null
        });

        if (error) {
            throw new BadRequestException(error.message);
        }

        return { message: 'Wallet topped up successfully', amount, agentId };
    }
}
