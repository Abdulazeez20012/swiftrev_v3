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
            .maybeSingle();

        if (error) {
            console.error(`[WalletsService] Error fetching wallet for hospital ${hospitalId}:`, error);
            throw new BadRequestException(error.message);
        }

        if (!data) {
            // Return a default virtual wallet if none exists yet
            return {
                hospital_id: hospitalId,
                balance: 0,
                status: 'active',
                created_at: new Date().toISOString()
            };
        }

        return data;
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

    async topUp(hospitalId: string, amount: number, userId: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase.rpc('update_wallet_balance', {
            h_id: hospitalId,
            amt: amount
        });

        if (error) {
            throw new BadRequestException(error.message);
        }

        return { message: 'Wallet topped up successfully', amount };
    }
}
