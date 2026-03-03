import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
    Search,
    Download,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    CheckCircle2,
    Clock,
    ArrowRightLeft,
    Plus,
    AlertCircle
} from 'lucide-react';

import NewTransactionModal from '../components/NewTransactionModal';

const Transactions = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('');
    const [offset, setOffset] = useState(0);
    const [limit] = useState(20);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchTransactions = async () => {
        try {
            if (!user?.hospitalId) return;
            setLoading(true);
            const response = await api.get(`/transactions`, {
                params: {
                    hospitalId: user.hospitalId,
                    status: statusFilter || undefined,
                    paymentMethod: paymentFilter || undefined,
                    limit: limit,
                    offset: offset
                }
            });
            setTransactions(response.data.data);
            setTotalCount(response.data.count);
        } catch (error) {
            console.error('Failed to fetch transactions', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [user, statusFilter, paymentFilter, offset]);

    const handleExport = () => {
        const headers = ['ID', 'Date', 'Patient', 'Item', 'Amount', 'Method', 'Status'];
        const rows = transactions.map(tx => [
            tx.id,
            new Date(tx.created_at).toLocaleString(),
            tx.patients?.full_name || 'N/A',
            tx.revenue_items?.name || 'N/A',
            tx.amount,
            tx.payment_method,
            tx.status
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `transactions_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredTransactions = transactions.filter(tx =>
        tx.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.revenue_items?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Transaction History</h1>
                    <p className="text-muted-foreground mt-1">Audit and manage all financial records for this hospital.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-bold shadow-sm hover:bg-secondary transition-all"
                    >
                        <Download className="h-4 w-4" />
                        Download CSV
                    </button>
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
                onSuccess={() => fetchTransactions()}
            />

            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 items-center justify-between bg-card/50 backdrop-blur-sm">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search patients or items..."
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <select
                            className="bg-background border border-border rounded-xl text-sm font-medium px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setOffset(0); }}
                        >
                            <option value="">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                        <select
                            className="bg-background border border-border rounded-xl text-sm font-medium px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={paymentFilter}
                            onChange={(e) => { setPaymentFilter(e.target.value); setOffset(0); }}
                        >
                            <option value="">All Methods</option>
                            <option value="cash">Cash</option>
                            <option value="transfer">Transfer</option>
                            <option value="card">Card</option>
                            <option value="pos">POS</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/30">
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border">Transaction ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border">Patient</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border">Item / Service</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredTransactions.length ? filteredTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-secondary/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-primary/5 rounded-lg text-primary">
                                                <ArrowRightLeft className="h-4 w-4" />
                                            </div>
                                            <span className="text-xs font-mono font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap w-24 block">
                                                {tx.id.split('-')[0]}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-foreground">{tx.patients?.full_name || 'Patient Deleted'}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{new Date(tx.created_at).toLocaleDateString()}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-foreground">{tx.revenue_items?.name}</p>
                                        <p className="text-[10px] text-primary uppercase font-bold tracking-tight">Billing Item</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-extrabold text-foreground">₦{tx.amount.toLocaleString()}</p>
                                            {tx.ml_predictions?.some((p: any) => p.prediction_value?.is_anomaly) && (
                                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 text-red-600 rounded-md border border-red-500/20 animate-pulse">
                                                    <AlertCircle className="h-3 w-3" />
                                                    <span className="text-[8px] font-black uppercase">High Risk</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">{tx.payment_method}</p>
                                            {tx.insurance_providers?.name && (
                                                <span className="text-[8px] bg-primary/10 text-primary px-1 rounded uppercase font-black">
                                                    {tx.insurance_providers.name}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            <span className="text-xs font-bold text-emerald-600 uppercase">Completed</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-secondary rounded-lg transition-all text-muted-foreground">
                                            <MoreVertical className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center opacity-40">
                                            <Clock className="h-12 w-12 mb-4" />
                                            <p className="text-sm font-bold">No transactions found matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-border flex items-center justify-between bg-card/50">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Showing {offset + 1}-{Math.min(offset + limit, totalCount)} of {totalCount} results
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setOffset(Math.max(0, offset - limit))}
                            disabled={offset === 0}
                            className="p-2 border border-border rounded-xl hover:bg-secondary disabled:opacity-30"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setOffset(offset + limit)}
                            disabled={offset + limit >= totalCount}
                            className="p-2 border border-border rounded-xl hover:bg-secondary disabled:opacity-30"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Transactions;
