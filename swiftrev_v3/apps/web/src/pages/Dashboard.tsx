import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
    TrendingUp,
    Receipt,
    Users,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Plus,
    Activity
} from 'lucide-react';

import NewTransactionModal from '../components/NewTransactionModal';

interface DashboardStats {
    walletBalance: number;
    totalTransactions: number;
    recentTransactions: any[];
    revenueLast7Days: number;
}

const StatCard = ({ label, value, subValue, type, icon: Icon, trend }: any) => (
    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border group hover:border-primary/50 transition-all hover:shadow-md">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${type === 'primary' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'} group-hover:scale-110 transition-transform`}>
                <Icon className="h-6 w-6" />
            </div>
            {trend && (
                <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                    {trend > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {Math.abs(trend)}%
                </span>
            )}
        </div>
        <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-extrabold mt-1 text-foreground">{value}</p>
            {subValue && <p className="text-xs text-muted-foreground/60 mt-1 font-medium">{subValue}</p>}
        </div>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            if (!user?.hospitalId) return;
            setLoading(true);

            // Parallel fetching
            const [walletRes, transactionsRes] = await Promise.all([
                api.get(`/wallets/${user.hospitalId}`),
                api.get(`/transactions?hospitalId=${user.hospitalId}`)
            ]);

            setStats({
                walletBalance: walletRes.data.balance || 0,
                totalTransactions: transactionsRes.data.length || 0,
                recentTransactions: transactionsRes.data.slice(0, 5) || [],
                revenueLast7Days: 0, // Mock for now until we have time-series endpoint
            });
        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Welcome back, <span className="text-primary font-semibold">{user?.email?.split('@')[0]}</span>.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-card border border-border rounded-xl text-sm font-bold shadow-sm hover:bg-secondary transition-all">Export Analysis</button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        New Transaction
                    </button>
                </div>
            </div>

            <NewTransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => fetchData()}
            />


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Wallet Balance"
                    value={`₦${(stats?.walletBalance || 0).toLocaleString()}`}
                    subValue="Available for settlement"
                    type="primary"
                    icon={CreditCard}
                />
                <StatCard
                    label="Cumulative Revenue"
                    value={`₦${((stats?.totalTransactions || 0) * 1500).toLocaleString()}`} // Mock calculation
                    subValue="Current month"
                    icon={TrendingUp}
                    trend={12.5}
                />
                <StatCard
                    label="Total Receipts"
                    value={stats?.totalTransactions || 0}
                    subValue="Successfully processed"
                    icon={Receipt}
                    trend={8.2}
                />
                <StatCard
                    label="New Patients"
                    value="24"
                    subValue="Registered this week"
                    icon={Users}
                    trend={-2.1}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Column */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-card p-6 rounded-3xl shadow-sm border border-border relative overflow-hidden h-[400px]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-xl">Revenue Growth</h3>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">Week</span>
                                <span className="px-3 py-1 rounded-full text-muted-foreground text-xs font-bold hover:bg-secondary cursor-pointer">Month</span>
                            </div>
                        </div>
                        {/* Chart Simulation */}
                        <div className="flex items-end justify-between h-48 gap-4 px-4">
                            {[40, 65, 45, 90, 75, 55, 100].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                    <div
                                        className="w-full bg-primary/20 rounded-xl relative overflow-hidden group-hover:bg-primary/30 transition-all duration-500"
                                        style={{ height: `${h}%` }}
                                    >
                                        <div className="absolute inset-0 bg-primary opacity-40 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                                        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Day {i + 1}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                                <p className="text-xs font-bold text-muted-foreground uppercase">Peak Day</p>
                                <p className="text-lg font-bold">Friday, Feb 15</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                                <p className="text-xs font-bold text-muted-foreground uppercase">Average daily</p>
                                <p className="text-lg font-bold">₦24,500</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* List Column */}
                <div className="space-y-6">
                    <div className="bg-card p-6 rounded-3xl shadow-sm border border-border h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-xl">Recent Activity</h3>
                            <Clock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-6 flex-1">
                            {stats?.recentTransactions.length ? stats.recentTransactions.map((tx, i) => (
                                <div key={i} className="flex items-center gap-4 group cursor-pointer hover:bg-secondary/30 p-2 rounded-2xl transition-all">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                                        {tx.patients?.full_name?.charAt(0) || 'P'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate text-foreground">{tx.patients?.full_name || 'Anonymous'}</p>
                                        <p className="text-xs text-muted-foreground font-medium truncate">{tx.revenue_items?.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-extrabold text-foreground">₦{tx.amount.toLocaleString()}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
                                    <Activity className="h-12 w-12 mb-4" />
                                    <p className="text-sm font-medium">No recent activity detected.</p>
                                </div>
                            )}
                        </div>
                        <button className="w-full mt-6 py-3 bg-secondary text-foreground text-sm font-bold rounded-2xl border border-border hover:bg-secondary/80 transition-all flex items-center justify-center gap-2">
                            View History
                            <ArrowUpRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
