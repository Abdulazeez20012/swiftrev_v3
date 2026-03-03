import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    ShieldCheck,
    Search,
    Download,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Clock,
    DollarSign,
    FileText,
    Loader2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const ClaimsDashboard = () => {
    const [claims, setClaims] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({ totalPending: 0, countPending: 0, totalSettled: 0, countSettled: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [offset, setOffset] = useState(0);
    const [limit] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const [settlingId, setSettlingId] = useState<string | null>(null);
    const [settlementRef, setSettlementRef] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [claimsRes, statsRes] = await Promise.all([
                api.get('/claims', { params: { limit, offset } }),
                api.get('/claims/stats')
            ]);
            setClaims(claimsRes.data.data);
            setTotalCount(claimsRes.data.count);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to fetch claims data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [offset]);

    const handleSettle = async (id: string, ref: string) => {
        if (!ref) return;
        try {
            await api.post(`/claims/${id}/settle`, { reference: ref });
            setSettlingId(null);
            setSettlementRef('');
            fetchData();
        } catch (error) {
            console.error('Failed to settle claim', error);
        }
    };

    const filteredClaims = claims.filter(c =>
        c.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.auth_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && claims.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                        NHIS Claims Engine
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage insurance settlements and HMO reconciliation.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-bold shadow-sm hover:bg-secondary transition-all">
                        <Download className="h-4 w-4" />
                        Export Claims
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Pending Payouts', value: `₦${stats.totalPending.toLocaleString()}`, sub: `${stats.countPending} claims`, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Total Settled', value: `₦${stats.totalSettled.toLocaleString()}`, sub: `${stats.countSettled} claims`, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Claim Payout Rate', value: `${stats.totalSettled + stats.totalPending > 0 ? Math.round((stats.totalSettled / (stats.totalSettled + stats.totalPending)) * 100) : 0}%`, sub: 'Approval efficiency', icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Average Auth Time', value: '4.2 Days', sub: 'vs 5.1 target', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                ].map((s, i) => (
                    <div key={i} className="bg-card p-6 rounded-[2rem] border border-border shadow-sm flex items-center gap-4 transition-all hover:scale-[1.02] hover:shadow-md">
                        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm", s.bg)}>
                            <s.icon className={cn("h-6 w-6", s.color)} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">{s.label}</p>
                            <h3 className="text-xl font-black tracking-tight">{s.value}</h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{s.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Claims Tools */}
            <div className="bg-card rounded-[2.5rem] border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-border flex flex-col md:flex-row gap-4 items-center justify-between bg-card/50 backdrop-blur-sm">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by Patient or Auth Code..."
                            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase px-2">HMO Partner</span>
                        <select className="bg-background border border-border rounded-xl text-xs font-bold py-2 px-4 focus:ring-2 focus:ring-primary/20 transition-all outline-none cursor-pointer">
                            <option>All Partners</option>
                            <option>NHIS</option>
                            <option>Reliance HMO</option>
                            <option>AXA Mansard</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/30">
                                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border leading-none">Authorization</th>
                                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border leading-none">Patient Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border leading-none">Service</th>
                                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border leading-none text-right">Claim Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border leading-none text-right">Settlement</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredClaims.length ? filteredClaims.map((tx) => (
                                <tr key={tx.id} className="hover:bg-secondary/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-foreground font-mono">{tx.auth_code || 'NO-AUTH'}</span>
                                            <span className="text-[10px] text-primary font-bold uppercase tracking-tighter">{tx.insurance_providers?.name || 'Unknown HMO'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-foreground">{tx.patients?.full_name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-foreground">{tx.revenue_items?.name}</p>
                                        <div className="flex gap-2 mt-1">
                                            {tx.proof_image_url && <span className="text-[8px] bg-emerald-500/10 text-emerald-600 px-1 rounded font-black uppercase">Proof Attached</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="text-sm font-black text-foreground">₦{tx.amount.toLocaleString()}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">NHIS Tariff</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {settlingId === tx.id ? (
                                            <div className="flex items-center gap-2 justify-end animate-in fade-in slide-in-from-right-2">
                                                <input
                                                    type="text"
                                                    placeholder="Bank Ref..."
                                                    className="w-24 px-2 py-1 bg-background border border-primary rounded text-[10px] focus:outline-none"
                                                    value={settlementRef}
                                                    onChange={e => setSettlementRef(e.target.value)}
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleSettle(tx.id, settlementRef)}
                                                    className="p-1 bg-primary text-primary-foreground rounded hover:scale-105 transition-transform"
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setSettlingId(null)}
                                                    className="p-1 bg-secondary text-foreground rounded hover:scale-105 transition-transform"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setSettlingId(tx.id)}
                                                className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm"
                                            >
                                                Settle Now
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center opacity-30 grayscale">
                                            <ShieldCheck className="h-16 w-16 mb-4" />
                                            <h3 className="text-xl font-black uppercase tracking-tighter">Queue Clear!</h3>
                                            <p className="text-sm font-bold max-w-xs">All insurance claims for this period have been successfully reconciled.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-border flex items-center justify-between bg-card/50">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Claims Queue: {offset + 1}-{Math.min(offset + limit, totalCount)} of {totalCount} records
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setOffset(Math.max(0, offset - limit))}
                            disabled={offset === 0}
                            className="p-2 border border-border rounded-xl hover:bg-secondary disabled:opacity-30 transition-all font-black text-[10px] uppercase flex items-center gap-1"
                        >
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </button>
                        <button
                            onClick={() => setOffset(offset + limit)}
                            disabled={offset + limit >= totalCount}
                            className="p-2 border border-border rounded-xl hover:bg-secondary disabled:opacity-30 transition-all font-black text-[10px] uppercase flex items-center gap-1"
                        >
                            Next <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const X = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

export default ClaimsDashboard;
