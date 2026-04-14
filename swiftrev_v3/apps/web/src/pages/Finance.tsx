import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    Building2,
    Users,
    ArrowRight,
    Search,
    History,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface User {
    id: string;
    name?: string;
    full_name?: string;
    email: string;
    role: string;
    hospitalId?: string;
}

interface Wallet {
    id: string;
    agentId?: string;
    user_id?: string;
    userId?: string;
    balance: number;
    limit?: number;
    daily_limit?: number;
}

interface Hospital {
    id: string;
    name: string;
    address?: string;
    status?: string;
}

interface Transaction {
    id: string;
    reference_id?: string;
    referenceId?: string;
    amount: number;
    new_balance?: number;
    newBalance?: number;
    created_at?: string;
    timestamp?: string;
    agentId?: string;
    agent_id?: string;
    payment_method?: string;
    status?: string;
}

// FundingTransaction alias for backward compatibility if needed, 
// but I'll replace usage in the next step.
type FundingTransaction = Transaction;

interface AgentStatus {
    agent: User;
    balance: number;
    pct: number;
    status: 'critical' | 'low' | 'healthy';
}

// ─── Finance Page Shell ───────────────────────────────────────────────────────
export const Finance: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'topup'>('dashboard');
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Finance Administration</h2>
                    <p className="text-muted-foreground">Manage agent wallets and monitor consolidated revenue.</p>
                </div>
                <div className="flex gap-2 bg-secondary p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'dashboard' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >Cash Collections</button>
                    <button
                        onClick={() => setActiveTab('topup')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'topup' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >Hospital Operating Float</button>
                </div>
            </div>
            {activeTab === 'dashboard' ? <FinanceDashboard /> : <TopUpModule />}
        </div>
    );
};

// ─── Wallet Health Dashboard ──────────────────────────────────────────────────
const FinanceDashboard: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [agentUsers, setAgentUsers] = useState<User[]>([]);
    const [agentBalances, setAgentBalances] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const hospitalId = currentUser?.hospitalId;
                if (!hospitalId) return;

                const [usersRes, txRes] = await Promise.all([
                    api.get<User[]>(`/users?hospitalId=${hospitalId}`),
                    api.get<any>(`/transactions?hospitalId=${hospitalId}&limit=1000`),
                ]);

                const allUsers = usersRes.data || [];
                const agents = allUsers.filter(u =>
                    ['field_agent', 'agent', 'finance_officer'].includes((u.role || '').toLowerCase())
                );
                setAgentUsers(agents);

                // Aggregate cash collection balances per agent
                const transactions = (txRes.data?.data || txRes.data || []) as Transaction[];
                const balances: Record<string, number> = {};
                transactions.forEach(tx => {
                    const agentId = tx.agent_id || tx.agentId;
                    if (tx.payment_method === 'cash' && (tx.status === 'completed' || tx.status === 'success') && agentId) {
                        balances[agentId] = (balances[agentId] || 0) + Number(tx.amount || 0);
                    }
                });
                setAgentBalances(balances);
            } catch (err) {
                console.error('Failed to fetch finance dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser?.hospitalId]);

    const totalBalance = Object.values(agentBalances).reduce((a, b) => a + b, 0);
    const agentsWithStatus: AgentStatus[] = agentUsers.map(agent => {
        const balance = agentBalances[agent.id] || 0;
        const limit = 100000; // Expected weekly goal / collection cap
        const pct = (balance / limit) * 100;
        // In this context, HIGH balance means critical (liability to the hospital)
        const status: 'critical' | 'low' | 'healthy' = pct > 80 ? 'critical' : pct > 50 ? 'low' : 'healthy';
        return { agent, balance, pct, status };
    });

    const lowCount = agentsWithStatus.filter(a => a.status !== 'healthy').length;
    const avgUtil = agentsWithStatus.length > 0
        ? (agentsWithStatus.reduce((a, w) => a + w.pct, 0) / agentsWithStatus.length).toFixed(0)
        : '0';

    const statusColors = { healthy: 'bg-emerald-100 text-emerald-700', low: 'bg-amber-100 text-amber-700', critical: 'bg-rose-100 text-rose-700' };
    const barColors = { healthy: 'bg-emerald-500', low: 'bg-amber-500', critical: 'bg-rose-500' };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
                <RefreshCw size={18} className="animate-spin" /> Loading wallet data...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-muted-foreground mb-1">Total Outstanding Cash</p>
                    <p className="text-2xl font-bold text-foreground">₦{totalBalance.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Held by {agentUsers.length} agent{agentUsers.length !== 1 ? 's' : ''}</p>
                </div>
                <div className={`rounded-2xl border p-5 shadow-sm ${lowCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-card border-border'}`}>
                    <p className={`text-sm font-medium mb-1 ${lowCount > 0 ? 'text-rose-600' : 'text-muted-foreground'}`}>High Liability Agents</p>
                    <p className={`text-2xl font-bold ${lowCount > 0 ? 'text-rose-700' : 'text-foreground'}`}>{lowCount} Agent{lowCount !== 1 ? 's' : ''}</p>
                    <p className={`text-xs mt-1 ${lowCount > 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>{lowCount > 0 ? 'Require immediate remittance' : 'All agents within limit'}</p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-muted-foreground mb-1">Avg. Liability Level</p>
                    <p className="text-2xl font-bold text-foreground">{avgUtil}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Of total collection cap</p>
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border flex justify-between items-center">
                    <h3 className="font-bold text-foreground">Agent Collection Status</h3>
                    <span className="text-xs text-muted-foreground">Monitor cash held by field agents</span>
                </div>
                {agentsWithStatus.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Users size={36} className="mb-3 opacity-30" />
                        <p className="text-sm">No field agents found for this hospital.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {agentsWithStatus.map(({ agent, balance, pct, status }) => (
                            <div key={agent.id} className="p-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                                    {(agent.name || agent.full_name || agent.email || 'A').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-semibold text-sm truncate">{agent.name || agent.full_name || agent.email}</p>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ml-2 shrink-0 ${statusColors[status]}`}>{status}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2 capitalize">{(agent.role || '').replace(/_/g, ' ')}</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${barColors[status]}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                        </div>
                                        <span className="text-xs font-bold text-foreground shrink-0">₦{balance.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Top-Up Module ────────────────────────────────────────────────────────────
const TopUpModule: React.FC = () => {
    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'super_admin';
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [agents, setAgents] = useState<User[]>([]);
    const [fundingHistory, setFundingHistory] = useState<FundingTransaction[]>([]);
    const [selectedHospital, setSelectedHospital] = useState(currentUser?.hospitalId || '');
    const [selectedAgent, setSelectedAgent] = useState('');
    const [amount, setAmount] = useState('');
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [historySearch, setHistorySearch] = useState('');

    // Load hospitals (super_admin only)
    useEffect(() => {
        if (isSuperAdmin) {
            api.get<Hospital[]>('/hospitals').then(r => setHospitals(r.data || [])).catch(() => { });
        }
    }, [isSuperAdmin]);

    // Load agents when hospital changes
    useEffect(() => {
        if (selectedHospital) {
            api.get<User[]>(`/users?hospitalId=${selectedHospital}`)
                .then(r => {
                    const allUsers = r.data || [];
                    setAgents(allUsers.filter(u =>
                        ['field_agent', 'agent', 'finance_officer'].includes((u.role || '').toLowerCase())
                    ));
                })
                .catch(() => setAgents([]));
        } else {
            setAgents([]);
        }
        setSelectedAgent('');
        setWalletBalance(null);
    }, [selectedHospital]);

    // Load wallet balance when agent changes
    useEffect(() => {
        if (selectedAgent && selectedHospital) {
            api.get<Wallet[]>(`/wallets/hospital/${selectedHospital}`)
                .then(r => {
                    const walletsList = Array.isArray(r.data) ? r.data : [];
                    const w = walletsList.find(wl => wl.agentId === selectedAgent || wl.user_id === selectedAgent);
                    setWalletBalance(w ? Number(w.balance || 0) : 0);
                })
                .catch(() => setWalletBalance(0));
        } else {
            setWalletBalance(null);
        }
    }, [selectedAgent, selectedHospital]);

    // Load funding history
    const loadHistory = React.useCallback(async () => {
        const hospitalId = selectedHospital || currentUser?.hospitalId;
        if (!hospitalId) return;
        api.get<FundingTransaction[]>(`/wallets/history/${hospitalId}`)
            .then(r => setFundingHistory(Array.isArray(r.data) ? r.data : []))
            .catch(() => { });
    }, [selectedHospital, currentUser?.hospitalId]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const confirmTransaction = async () => {
        setIsLoading(true);
        try {
            await api.post('/wallets/top-up', {
                hospitalId: selectedHospital,
                amount: parseFloat(amount),
                agentId: selectedAgent || undefined
            });
            await loadHistory();
            setAmount('');
            setShowConfirm(false);
            // Refresh balance
            setSelectedAgent(prev => { setTimeout(() => setSelectedAgent(prev), 10); return ''; });
            alert('Funding Successful!');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            alert('Funding Failed: ' + message);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredHistory = fundingHistory.filter(tx =>
        !historySearch ||
        (tx.reference_id || tx.referenceId || '').toLowerCase().includes(historySearch.toLowerCase())
    );

    const selectedAgentData = agents.find(a => a.id === selectedAgent);
    const selectedAgentName = selectedAgentData?.name || selectedAgentData?.full_name || selectedAgent;
    const selectedHospitalName = hospitals.find(h => h.id === selectedHospital)?.name || selectedHospital;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Funding form */}
            <div className="lg:col-span-1">
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2"><CreditCard className="text-primary" /> Fund Agent Wallet</h3>
                    {/* Hospital selector — super_admin only */}
                    {isSuperAdmin && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Hospital</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <select className="w-full pl-10 pr-4 py-2 bg-secondary border-none rounded-lg" value={selectedHospital} onChange={(e) => setSelectedHospital(e.target.value)}>
                                <option value="">Select Hospital...</option>
                                {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
                        </div>
                    </div>
                    )}
                    {!isSuperAdmin && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 rounded-xl p-3">
                            <p className="text-xs font-bold text-blue-700">Funding agents for your hospital only.</p>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Agent</label>
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <select className="w-full pl-10 pr-4 py-2 bg-secondary border-none rounded-lg" value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)} disabled={!selectedHospital}>
                                <option value="">Select Agent...</option>
                                {agents.map(a => <option key={a.id} value={a.id}>{a.name || a.full_name || a.email}</option>)}
                            </select>
                        </div>
                    </div>
                    {walletBalance !== null && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100">
                            <p className="text-xs text-blue-600 font-medium uppercase">Current Balance</p>
                            <p className="text-2xl font-bold text-blue-700">₦{walletBalance.toLocaleString()}</p>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium mb-1">Funding Amount (₦)</label>
                        <input type="number" className="w-full px-4 py-2 bg-secondary border-none rounded-lg font-mono font-bold" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                    <button
                        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                        disabled={!selectedAgent || !amount || parseFloat(amount) <= 0}
                        onClick={() => setShowConfirm(true)}
                    >
                        Review & Fund <ArrowRight size={18} />
                    </button>
                </div>
            </div>

            {/* Audit trail */}
            <div className="lg:col-span-2">
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border flex justify-between items-center">
                        <h3 className="text-lg font-bold flex items-center gap-2"><History className="text-muted-foreground" /> Funding History</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input type="text" placeholder="Search ref..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} className="pl-9 pr-4 py-1.5 bg-secondary border-none rounded-lg text-sm" />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Ref ID</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">New Balance</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredHistory.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground italic">No funding history found.</td></tr>
                                ) : filteredHistory.map((tx, i) => (
                                    <tr key={tx.id || i} className="hover:bg-secondary/30">
                                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{tx.reference_id || tx.referenceId || '—'}</td>
                                        <td className="px-6 py-4 font-bold text-emerald-600">+₦{Number(tx.amount || 0).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-muted-foreground">₦{Number(tx.new_balance || tx.newBalance || 0).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {(() => {
                                                const d = tx.created_at || tx.timestamp;
                                                return d ? new Date(d).toLocaleDateString() : '—';
                                            })()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                                                <CheckCircle2 size={12} /> Success
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Confirm modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-card rounded-2xl shadow-xl max-w-md w-full p-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle size={32} /></div>
                            <h3 className="text-xl font-bold">Confirm Funding</h3>
                        </div>
                        <div className="bg-secondary rounded-xl p-4 space-y-2 mb-6">
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Agent:</span><span className="font-medium">{selectedAgentName}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Hospital:</span><span className="font-medium">{selectedHospitalName}</span></div>
                            <div className="border-t border-border my-2" />
                            <div className="flex justify-between text-lg font-bold"><span>Amount:</span><span className="text-primary">₦{parseFloat(amount || '0').toLocaleString()}</span></div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 text-muted-foreground font-medium hover:bg-secondary rounded-xl">Cancel</button>
                            <button onClick={confirmTransaction} disabled={isLoading} className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2">
                                {isLoading ? 'Processing...' : 'Confirm & Fund'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;
