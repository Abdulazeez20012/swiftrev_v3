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

        if (pError) throw new BadRequestException(`Failed to fetch patients: ${pError.message}`);
        const pCount = patientsCount || 0;

        // 2. Get Revenue Total and Recent Transactions
        const { data: transactions, error: tError } = await supabase
            .from('transactions')
            .select('*, patients(full_name), revenue_items(name)')
            .eq('hospital_id', hospitalId)
            .eq('agent_id', agentId)
            .order('created_at', { ascending: false });

        if (tError) throw new BadRequestException(`Failed to fetch transactions: ${tError.message}`);
        if (!transactions || transactions.length === 0) {
            return { patientsCount: pCount, revenueTotal: 0, balance: 0, performance: 0, recentActivity: [] };
        }

        const revenueTotal = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

        // 3. Get Agent Wallet/Balance (Operating Float)
        const { data: walletData } = await supabase
            .from('wallets')
            .select('total_balance')
            .eq('hospital_id', hospitalId)
            .eq('user_id', agentId)
            .maybeSingle();
        
        const availableFloat = walletData ? Number(walletData.total_balance || 0) : 0;

        // 4. Calculate Categorized Earnings
        const cashHeld = transactions
            .filter(tx => tx.payment_method === 'cash' && tx.status === 'completed')
            .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

        const posTotal = transactions
            .filter(tx => (tx.payment_method === 'card' || tx.payment_method === 'pos') && tx.status === 'completed')
            .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
        
        const transferTotal = transactions
            .filter(tx => tx.payment_method === 'transfer' && tx.status === 'completed')
            .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

        // 5. Calculate Performance (e.g., % of a weekly goal)
        const weeklyGoal = 100000;
        const performance = Math.min(Math.round((revenueTotal / weeklyGoal) * 100), 100);

        // 5. Get Departments Count
        const { count: deptsCount } = await supabase
            .from('departments')
            .select('*', { count: 'exact', head: true })
            .eq('hospital_id', hospitalId);

        // 6. Get Revenue Items Count
        const { count: itemsCount } = await supabase
            .from('revenue_items')
            .select('*', { count: 'exact', head: true })
            .eq('hospital_id', hospitalId);

        // 7. Format Recent Activity
        const recentActivity = transactions.slice(0, 5).map(tx => ({
            title: `${tx.revenue_items?.name || 'Service'} - ${tx.patients?.full_name || 'Anonymous'}`,
            time: this.formatTime(tx.created_at),
            status: (tx.status || 'unknown').toUpperCase(),
        }));

        console.log(`DashboardService.getAgentStats: Success for agent ${agentId}`);

        return {
            patientsCount: pCount,
            revenueTotal: revenueTotal || 0,
            balance: availableFloat || 0,
            cashHeld: cashHeld || 0,
            posTotal: posTotal || 0,
            transferTotal: transferTotal || 0,
            availableFloat: availableFloat || 0,
            performance: performance || 0,
            recentActivity: recentActivity || [],
            departmentsCount: deptsCount || 0,
            revenueItemsCount: itemsCount || 0,
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
