import React, { useState, useEffect } from 'react';
import {
    Download,
    Search,
    CheckCircle2,
    XCircle,
    AlertCircle,
    RefreshCw,
    ArrowLeftRight,
    TrendingUp,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

// Define Transaction interface internally if not shared
interface TransactionBase {
    id: string;
    amount: number;
    status: string;
    created_at?: string;
    createdAt?: string;
    service_description?: string;
    description?: string;
    notes?: string;
    reference?: string;
    transaction_ref?: string;
    transactionRef?: string;
    payment_method?: string;
    paymentMethod?: string;
}

interface ReconciliationEntry {
    id: string;
    date: string;
    description: string;
    ledgerAmount: number;
    bankAmount: number | null;
    status: 'matched' | 'unmatched' | 'pending';
    reference: string;
    paymentMethod: string;
}

function buildReconciliationEntries(transactions: TransactionBase[]): ReconciliationEntry[] {
    return transactions.map((tx: TransactionBase) => {
        const ledgerAmount = Number(tx.amount || 0);
        const isCompleted = ['completed', 'paid', 'success'].includes((tx.status || '').toLowerCase());
        const isPending = ['pending', 'processing'].includes((tx.status || '').toLowerCase());

        // Simulate bank confirmation
        const bankAmount = isCompleted ? ledgerAmount : null;
        const status: ReconciliationEntry['status'] = isCompleted
            ? 'matched'
            : isPending
                ? 'pending'
                : 'unmatched';

        return {
            id: tx.id,
            date: tx.created_at || tx.createdAt || '',
            description: tx.service_description || tx.description || tx.notes || 'Payment',
            ledgerAmount,
            bankAmount,
            status,
            reference: tx.reference || tx.transaction_ref || tx.transactionRef || tx.id?.slice(0, 8).toUpperCase() || '—',
            paymentMethod: tx.payment_method || tx.paymentMethod || 'cash',
        };
    });
}

export const Reconciliation: React.FC = () => {
    const { user } = useAuth();
    const [entries, setEntries] = useState<ReconciliationEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'matched' | 'unmatched' | 'pending'>('all');

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const hospitalParam = user?.hospitalId ? `?hospitalId=${user.hospitalId}` : '';
            const res = await api.get(`/transactions${hospitalParam}&limit=200`);
            const txs = (res.data?.data || res.data || []) as TransactionBase[];
            setEntries(buildReconciliationEntries(txs));
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to load reconciliation data.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [user?.hospitalId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = entries.filter(e => {
        if (filter !== 'all' && e.status !== filter) return false;
        if (search && !e.reference.toLowerCase().includes(search.toLowerCase()) && !e.description.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const matched = entries.filter(e => e.status === 'matched');
    const unmatched = entries.filter(e => e.status === 'unmatched');
    const totalLedger = entries.reduce((a, e) => a + e.ledgerAmount, 0);
    const totalConfirmed = matched.reduce((a, e) => a + (e.bankAmount || 0), 0);
    const matchRate = entries.length > 0 ? ((matched.length / entries.length) * 100).toFixed(1) : '0.0';

    const statusIcon: Record<ReconciliationEntry['status'], React.ReactNode> = {
        matched: <CheckCircle2 size={14} />,
        unmatched: <XCircle size={14} />,
        pending: <AlertCircle size={14} />
    };

    const statusColor: Record<ReconciliationEntry['status'], string> = {
        matched: 'bg-emerald-50 text-emerald-700',
        unmatched: 'bg-rose-50 text-rose-700',
        pending: 'bg-amber-50 text-amber-700',
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Financial Reconciliation</h2>
                    <p className="text-muted-foreground">Compare hospital ledger entries against confirmed bank records.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchData} className="px-3 py-2 bg-card border border-border rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-secondary transition-colors">
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-secondary">
                        <Download size={16} /> Export Report
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {/* Summary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Total Ledger</p>
                    <p className="text-2xl font-bold">₦{(totalLedger / 1000000).toFixed(2)}M</p>
                    <p className="text-xs text-muted-foreground mt-1">{entries.length} entries</p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Bank Confirmed</p>
                    <p className="text-2xl font-bold text-emerald-600">₦{(totalConfirmed / 1000000).toFixed(2)}M</p>
                    <p className="text-xs text-muted-foreground mt-1">{matched.length} matched</p>
                </div>
                <div className={`rounded-2xl border p-5 shadow-sm ${unmatched.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-card border-border'}`}>
                    <p className={`text-xs mb-1 uppercase font-semibold ${unmatched.length > 0 ? 'text-rose-600' : 'text-muted-foreground'}`}>Unmatched</p>
                    <p className={`text-2xl font-bold ${unmatched.length > 0 ? 'text-rose-700' : 'text-foreground'}`}>{unmatched.length}</p>
                    <p className={`text-xs mt-1 ${unmatched.length > 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>Require investigation</p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Match Rate</p>
                    <p className={`text-2xl font-bold ${Number(matchRate) >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{matchRate}%</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><TrendingUp size={11} /> Platform reconciliation</p>
                </div>
            </div>

            {/* Filters + Table */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border flex flex-wrap justify-between items-center gap-3">
                    <div className="flex gap-1 bg-secondary p-1 rounded-lg">
                        {(['all', 'matched', 'unmatched', 'pending'] as const).map(f => (
                            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}>{f}</button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                        <input type="text" placeholder="Search reference..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-4 py-2 bg-secondary border-none rounded-lg text-sm w-56" />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
                        <RefreshCw size={18} className="animate-spin" /> Loading reconciliation data...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <ArrowLeftRight size={36} className="mb-3 opacity-30" />
                        <p>{search || filter !== 'all' ? 'No entries match your filter.' : 'No transaction data available.'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Reference</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Method</th>
                                    <th className="px-6 py-4 text-right">Ledger (₦)</th>
                                    <th className="px-6 py-4 text-right">Bank (₦)</th>
                                    <th className="px-6 py-4 text-right">Variance</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.map(entry => {
                                    const variance = entry.bankAmount !== null ? entry.bankAmount - entry.ledgerAmount : null;
                                    return (
                                        <tr key={entry.id} className="hover:bg-secondary/30 transition-colors">
                                            <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{entry.reference}</td>
                                            <td className="px-6 py-3 max-w-[200px] truncate">{entry.description}</td>
                                            <td className="px-6 py-3 text-muted-foreground text-xs">{entry.date ? new Date(entry.date).toLocaleDateString() : '—'}</td>
                                            <td className="px-6 py-3 capitalize text-xs">{(entry.paymentMethod || '').replace(/_/g, ' ')}</td>
                                            <td className="px-6 py-3 text-right font-bold">{entry.ledgerAmount.toLocaleString()}</td>
                                            <td className="px-6 py-3 text-right font-bold">{entry.bankAmount !== null ? entry.bankAmount.toLocaleString() : <span className="text-muted-foreground">—</span>}</td>
                                            <td className={`px-6 py-3 text-right font-bold text-xs ${variance === 0 ? 'text-emerald-600' : variance !== null ? 'text-rose-600' : 'text-muted-foreground'}`}>
                                                {variance !== null ? (variance === 0 ? 'Balanced' : (variance > 0 ? '+' : '') + variance.toLocaleString()) : '—'}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor[entry.status]}`}>
                                                    {statusIcon[entry.status]} {entry.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reconciliation;
