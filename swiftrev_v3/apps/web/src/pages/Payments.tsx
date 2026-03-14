import React, { useState, useEffect } from 'react';
import { Download, CreditCard, Smartphone, Banknote, Building2, TrendingUp, CheckCircle2, XCircle, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Transaction {
    id: string;
    payment_method?: string;
    paymentMethod?: string;
    amount: number;
    status: string;
    created_at?: string;
    patient?: { name?: string; full_name?: string };
    hospital?: { name?: string };
}

interface Refund {
    id: string;
    amount: number;
    reason?: string;
    status: string;
    created_at?: string;
    patient?: { name?: string; full_name?: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const METHOD_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
    swiftpay: { label: 'SwiftPay', icon: <Smartphone size={20} />, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    bank_transfer: { label: 'Bank Transfer', icon: <Building2 size={20} />, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    card: { label: 'Card', icon: <CreditCard size={20} />, color: 'text-violet-600', bgColor: 'bg-violet-100' },
    cash: { label: 'Cash', icon: <Banknote size={20} />, color: 'text-amber-600', bgColor: 'bg-amber-100' },
};

function normalizeMethod(m: string) {
    return (m || 'cash').toLowerCase().replace(/[\s-]/g, '_');
}

// ─── Sub-components ──────────────────────────────────────────────────────────
const MethodCard: React.FC<{ label: string; icon: React.ReactNode; color: string; bgColor: string; total: number; count: number; successRate: number; sharePercent: number }> = ({ label, icon, color, bgColor, total, count, successRate, sharePercent }) => (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl ${bgColor} ${color}`}>{icon}</div>
        </div>
        <p className="text-sm text-muted-foreground font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-foreground mb-1">₦{(total / 1000).toFixed(1)}K</p>
        <p className="text-xs text-muted-foreground mb-3">{count} transaction{count !== 1 ? 's' : ''}</p>
        <div className="w-full bg-secondary rounded-full h-1.5 mb-3">
            <div className={`h-1.5 rounded-full ${bgColor.replace('-100', '-500')}`} style={{ width: `${sharePercent}%` }} />
        </div>
        <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Share</span>
            <span className="font-bold">{sharePercent.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
            <span className="text-muted-foreground">Success rate</span>
            <span className={`font-bold ${successRate >= 95 ? 'text-emerald-600' : successRate >= 85 ? 'text-amber-600' : 'text-rose-600'}`}>{successRate.toFixed(1)}%</span>
        </div>
    </div>
);

const RefundRow: React.FC<{ refund: Refund }> = ({ refund }) => {
    const statusConfig = {
        approved: { color: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle2 size={11} />, label: 'Approved' },
        pending: { color: 'bg-amber-50 text-amber-700', icon: <Clock size={11} />, label: 'Pending' },
        rejected: { color: 'bg-rose-50 text-rose-700', icon: <XCircle size={11} />, label: 'Rejected' },
    };
    const key = (refund.status || 'pending').toLowerCase() as keyof typeof statusConfig;
    const s = statusConfig[key] || statusConfig.pending;
    const patientName = refund.patient?.name || refund.patient?.full_name || 'Unknown Patient';
    return (
        <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs shrink-0">{patientName.charAt(0)}</div>
                <div>
                    <p className="text-sm font-semibold">{patientName}</p>
                    <p className="text-xs text-muted-foreground">{refund.reason || 'No reason given'} · {refund.created_at ? new Date(refund.created_at).toLocaleDateString() : '—'}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className="font-bold text-sm">₦{Number(refund.amount).toLocaleString()}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.color}`}>{s.icon}{s.label}</span>
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const Payments: React.FC = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [refunds, setRefunds] = useState<Refund[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('week');

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const hospitalParam = user?.hospitalId ? `?hospitalId=${user.hospitalId}` : '';
            const [txRes, refundRes] = await Promise.all([
                api.get(`/transactions${hospitalParam}&limit=500`),
                api.get(`/refunds${hospitalParam}`).catch(() => ({ data: [] })),
            ]);
            setTransactions(txRes.data?.data || txRes.data || []);
            setRefunds(refundRes.data?.data || refundRes.data || []);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to load payment data.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [user?.hospitalId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Compute method stats from real transactions
    const methodStats = Object.entries(METHOD_CONFIG).map(([key, config]) => {
        const methodTx = transactions.filter(tx => normalizeMethod(tx.payment_method || tx.paymentMethod || '') === key);
        const total = methodTx.reduce((a, tx) => a + Number(tx.amount || 0), 0);
        const count = methodTx.length;
        const successful = methodTx.filter(tx => (tx.status || '').toLowerCase() === 'completed' || (tx.status || '').toLowerCase() === 'paid').length;
        const successRate = count > 0 ? (successful / count) * 100 : 0;
        return { ...config, key, total, count, successRate };
    });

    const grandTotal = methodStats.reduce((a, m) => a + m.total, 0);
    const grandCount = transactions.length;
    const grandSuccess = grandCount > 0
        ? (transactions.filter(tx => ['completed', 'paid'].includes((tx.status || '').toLowerCase())).length / grandCount) * 100
        : 0;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Payment Analytics</h2>
                    <p className="text-muted-foreground">Method breakdowns, volume trends and refund management.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex gap-1 bg-secondary p-1 rounded-lg text-sm">
                        {(['week', 'month', 'quarter'] as const).map(p => (
                            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-md font-medium capitalize transition-all ${period === p ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}>{p}</button>
                        ))}
                    </div>
                    <button onClick={fetchData} className="px-3 py-2 bg-card border border-border rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-secondary">
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-secondary transition-colors">
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
                    <RefreshCw size={18} className="animate-spin" /> Loading payment data...
                </div>
            ) : (
                <>
                    {/* Summary KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                            <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
                            <p className="text-3xl font-bold">₦{(grandTotal / 1000000).toFixed(2)}M</p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><TrendingUp size={12} className="text-emerald-500" /> Across all methods</p>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                            <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
                            <p className="text-3xl font-bold">{grandCount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground mt-1">Across all payment methods</p>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                            <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                            <p className={`text-3xl font-bold ${grandSuccess >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{grandSuccess.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground mt-1">Platform-wide payment success</p>
                        </div>
                    </div>

                    {/* Method cards */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Payment Method Breakdown</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {methodStats.map(stat => (
                                <MethodCard
                                    key={stat.key}
                                    label={stat.label}
                                    icon={stat.icon}
                                    color={stat.color}
                                    bgColor={stat.bgColor}
                                    total={stat.total}
                                    count={stat.count}
                                    successRate={stat.successRate}
                                    sharePercent={grandTotal > 0 ? (stat.total / grandTotal) * 100 : 0}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Refunds */}
                    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-foreground">Refunds</h3>
                            <span className="text-xs bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded-full">
                                {refunds.filter(r => r.status?.toLowerCase() === 'pending').length} Pending
                            </span>
                        </div>
                        {refunds.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8 italic">No refund records found.</p>
                        ) : (
                            refunds.slice(0, 8).map(r => <RefundRow key={r.id} refund={r} />)
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Payments;
