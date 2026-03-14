import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class DashboardService {
    constructor(private supabaseService: SupabaseService) { }

    async getAgentStats(hospitalId: string, agentId: string) {
        const supabase = this.supabaseService.getClient();

        // 1. Get Patients Count (onboarded by this agent)
        const { count: patientsCount, error: pError } = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true })
            .eq('hospital_id', hospitalId)
            .eq('onboarded_by', agentId);

        if (pError) throw new BadRequestException(pError.message);

        // 2. Get Revenue Total and Recent Transactions
        const { data: transactions, error: tError } = await supabase
            .from('transactions')
            .select('*, patients(full_name), revenue_items(name)')
            .eq('hospital_id', hospitalId)
            .eq('agent_id', agentId)
            .order('created_at', { ascending: false });

        if (tError) throw new BadRequestException(tError.message);

        const revenueTotal = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

        // 3. Get Agent Wallet/Balance
        // We define 'Balance' as the total CASH collected by the agent that belongs to the hospital.
        const balance = transactions
            .filter(tx => tx.payment_method === 'cash' && tx.status === 'completed')
            .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

        // 4. Calculate Performance (e.g., % of a weekly goal like 50,000)
        const weeklyGoal = 100000;
        const performance = Math.min(Math.round((revenueTotal / weeklyGoal) * 100), 100);

        // 5. Format Recent Activity
        const recentActivity = transactions.slice(0, 5).map(tx => ({
            title: `${tx.revenue_items?.name || 'Service'} - ${tx.patients?.full_name || 'Anonymous'}`,
            time: this.formatTime(tx.created_at),
            status: tx.status.toUpperCase(),
        }));

        return {
            patientsCount: patientsCount || 0,
            revenueTotal,
            balance,
            performance,
            recentActivity,
        };
    }

    private formatTime(dateStr: string) {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.round(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;

        const diffHours = Math.round(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;

        return date.toLocaleDateString();
    }
}
