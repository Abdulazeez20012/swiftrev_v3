import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class ReportsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    async getRevenueSummary(hospitalId: string, timeframe: 'daily' | 'weekly' | 'monthly') {
        const supabase = this.supabaseService.getClient();

        // Calculate the start date based on timeframe
        const now = new Date();
        let startDate: Date;

        if (timeframe === 'daily') {
            startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (timeframe === 'weekly') {
            startDate = new Date(now.setDate(now.getDate() - 7));
        } else {
            startDate = new Date(now.setMonth(now.getMonth() - 1));
        }

        const { data, error } = await supabase
            .from('transactions')
            .select('amount, created_at, revenue_items(name)')
            .eq('hospital_id', hospitalId)
            .eq('status', 'completed')
            .gte('created_at', startDate.toISOString());

        if (error) {
            throw new BadRequestException(error.message);
        }

        const totalRevenue = data.reduce((sum, tx) => sum + tx.amount, 0);
        const transactionCount = data.length;

        // Aggregate by item
        const byItem = data.reduce((acc: any, tx: any) => {
            const itemName = tx.revenue_items?.name || 'Unknown';
            acc[itemName] = (acc[itemName] || 0) + tx.amount;
            return acc;
        }, {});

        return {
            timeframe,
            totalRevenue,
            transactionCount,
            byItem,
            data,
        };
    }

    async getAgentPerformance(hospitalId: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('transactions')
            .select('amount, created_by, users(email)')
            .eq('hospital_id', hospitalId)
            .eq('status', 'completed');

        if (error) {
            throw new BadRequestException(error.message);
        }

        const agentStats = data.reduce((acc: any, tx: any) => {
            const agentId = tx.created_by;
            const agentEmail = tx.users?.email || 'Unknown';
            if (!acc[agentId]) {
                acc[agentId] = { email: agentEmail, totalCollected: 0, count: 0 };
            }
            acc[agentId].totalCollected += tx.amount;
            acc[agentId].count += 1;
            return acc;
        }, {});

        return Object.values(agentStats);
    }
}
