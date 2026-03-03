import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
    TrendingUp,
    Receipt,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Plus,
    Activity,
    ShieldAlert,
    Sparkles,
    BrainCircuit
} from 'lucide-react';

import NewTransactionModal from '../components/NewTransactionModal';

interface DashboardStats {
    walletBalance: number;
    totalTransactions: number;
    recentTransactions: any[];
    revenueLast7Days: number;
    chartData: { height: number; amount: number; label: string }[];
    patientCount: number;
    peakDay: string;
    averageDaily: number;
    fraudAlerts: number;
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

            const [walletRes, reportRes, patientsRes, fraudRes] = await Promise.all([
                api.get(`/wallets/hospital/${user.hospitalId}`),
                api.get(`/reports/revenue-summary?hospitalId=${user.hospitalId}&timeframe=monthly`),
                api.get(`/patients?hospitalId=${user.hospitalId}`),
                api.get('/transactions', { params: { hospitalId: user.hospitalId, limit: 100 } }).catch(() => ({ data: { data: [] } }))
            ]);

            const reportData = reportRes.data;
            const transactions = reportData.data || [];

            // Aggregate revenue by day for the last 7 days
            const last7Days = [...Array(7)].map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                return date.toISOString().split('T')[0];
            });

            const rawRevenueByDay = last7Days.map(dateStr => ({
                date: dateStr,
                amount: transactions
                    .filter((tx: any) => tx.created_at?.startsWith(dateStr))
                    .reduce((sum: number, tx: any) => sum + tx.amount, 0),
                label: new Date(dateStr).toLocaleDateString([], { weekday: 'short' })
            }));

            const maxDailyRevenue = Math.max(...rawRevenueByDay.map(d => d.amount), 1000);
            const totalWeekRevenue = rawRevenueByDay.reduce((s, d) => s + d.amount, 0);
            const avgDaily = Math.round(totalWeekRevenue / 7);
            const peakEntry = rawRevenueByDay.reduce((best, d) => d.amount > best.amount ? d : best, rawRevenueByDay[0]);
            const peakDayLabel = new Date(peakEntry.date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

            // Count ai fraud alerts
            const allTxs = fraudRes.data?.data || [];
            const fraudCount = allTxs.filter((tx: any) =>
                tx.ml_predictions?.some((p: any) => p.prediction_value?.is_anomaly)
            ).length;

            setStats({
                walletBalance: walletRes.data.balance || 0,
                totalTransactions: reportData.transactionCount || 0,
                recentTransactions: transactions.slice(0, 5) || [],
                revenueLast7Days: reportData.totalRevenue || 0,
                chartData: rawRevenueByDay.map(d => ({
                    height: (d.amount / maxDailyRevenue) * 100,
                    amount: d.amount,
                    label: d.label
                })),
                patientCount: patientsRes.data.length || 0,
                peakDay: peakDayLabel,
                averageDaily: avgDaily,
                fraudAlerts: fraudCount
            });
        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
        } finally {
            setLoading(false);
        }
    };

    // Forecast state
    const [forecast, setForecast] = useState<any[]>([]);
    useEffect(() => {
        if (!user?.hospitalId) return;
        const AI_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';
        fetch(`${AI_URL}/forecast/revenue/${user.hospitalId}?periods=7`)
            .then(r => r.json())
            .then(data => setForecast(Array.isArray(data) ? data.slice(0, 7) : []))
            .catch(() => setForecast([]));
    }, [user]);

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
                    value={`₦${(stats?.revenueLast7Days || 0).toLocaleString()}`}
                    subValue="Current month collection"
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
                <div
                    onClick={() => window.location.href = '/security'}
                    className="bg-card p-6 rounded-2xl shadow-sm border cursor-pointer transition-all hover:shadow-md"
                    style={{ borderColor: (stats?.fraudAlerts || 0) > 0 ? 'rgb(239 68 68 / 0.5)' : undefined }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${(stats?.fraudAlerts || 0) > 0 ? 'bg-red-500/10 text-red-500' : 'bg-secondary text-muted-foreground'}`}>
                            <ShieldAlert className="h-6 w-6" />
                        </div>
                        {(stats?.fraudAlerts || 0) > 0 && (
                            <span className="flex items-center text-xs font-bold px-2 py-1 rounded-full bg-red-500/10 text-red-500 animate-pulse">
                                {stats?.fraudAlerts} Alert{stats!.fraudAlerts > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Fraud Alerts</p>
                        <p className="text-2xl font-extrabold mt-1 text-foreground">{stats?.fraudAlerts || '—'}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1 font-medium">Click to review flags</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Column */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-card p-6 rounded-3xl shadow-sm border border-border relative overflow-hidden h-[400px]">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-bold text-xl flex items-center gap-2">
                                    Revenue Growth
                                    {forecast.length > 0 && (
                                        <span className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                                            <BrainCircuit className="h-3 w-3" /> AI Forecast
                                        </span>
                                    )}
                                </h3>
                                <p className="text-xs text-muted-foreground font-medium mt-0.5">Last 7 days actual + AI prediction</p>
                            </div>
                        </div>
                        {/* Chart */}
                        <div className="flex items-end justify-between h-48 gap-2 px-2">
                            {(stats?.chartData || Array(7).fill({ height: 40, amount: 0, label: '—' })).map((d: any, i: number) => (
                                <div key={`actual-${i}`} className="flex-1 flex flex-col items-center gap-2 group relative">
                                    {/* Tooltip */}
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-10">
                                        ₦{(d.amount || 0).toLocaleString()}
                                    </div>
                                    <div
                                        className="w-full bg-primary/20 rounded-xl relative overflow-hidden group-hover:bg-primary/40 transition-all duration-500"
                                        style={{ height: `${d.height || 4}%`, minHeight: '6px' }}
                                    >
                                        <div className="absolute inset-0 bg-primary opacity-40" />
                                        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                                    </div>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{d.label}</span>
                                </div>
                            ))}
                            {/* AI Forecast bars (dotted/faded) */}
                            {forecast.length > 0 && forecast.map((f: any, i: number) => {
                                const maxForecast = Math.max(...forecast.map((x: any) => x.yhat || 0), 1);
                                const h = ((f.yhat || 0) / maxForecast) * 80;
                                return (
                                    <div key={`forecast-${i}`} className="flex-1 flex flex-col items-center gap-2 opacity-60">
                                        <div
                                            className="w-full rounded-xl border-2 border-dashed border-primary/50 bg-primary/5"
                                            style={{ height: `${h}%`, minHeight: '4px' }}
                                            title={`Forecast: ₦${Math.round(f.yhat || 0).toLocaleString()}`}
                                        />
                                        <span className="text-[9px] font-bold text-primary/60 uppercase flex items-center gap-0.5">
                                            <Sparkles className="h-2 w-2" />
                                            {new Date(f.ds).toLocaleDateString([], { weekday: 'short' })}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                                <p className="text-xs font-bold text-muted-foreground uppercase">Peak Day</p>
                                <p className="text-sm font-bold">{stats?.peakDay || '—'}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                                <p className="text-xs font-bold text-muted-foreground uppercase">Daily Average</p>
                                <p className="text-sm font-bold">₦{(stats?.averageDaily || 0).toLocaleString()}</p>
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
                        <button
                            onClick={() => window.location.href = '/transactions'}
                            className="w-full mt-6 py-3 bg-secondary text-foreground text-sm font-bold rounded-2xl border border-border hover:bg-secondary/80 transition-all flex items-center justify-center gap-2"
                        >
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
