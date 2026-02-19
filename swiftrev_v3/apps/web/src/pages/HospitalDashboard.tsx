
import React, { useState, useEffect } from 'react';
import {
    Wallet,
    ArrowUpRight,
    TrendingUp,
    Activity,
    CreditCard,
    MoreHorizontal
} from 'lucide-react';
import { useDataService } from '../hooks/useDataService';
import type { HospitalWallet, Transaction } from 'core';

export const HospitalDashboard: React.FC = () => {
    const dataService = useDataService();
    const [wallet, setWallet] = useState<HospitalWallet | null>(null);
    const [lastCredit, setLastCredit] = useState<Transaction | null>(null);
    const [todayMetrics, setTodayMetrics] = useState({
        revenue: 0,
        count: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    // Mock Hospital ID for this session (In real app, comes from Auth Context)
    const CURRENT_HOSPITAL_ID = 'HOSP-001';

    useEffect(() => {
        const loadDashboardData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Wallet
                const walletResp = await dataService.wallets().getAll();
                const myWallet = walletResp.data?.find(w => w.hospital_id === CURRENT_HOSPITAL_ID);
                setWallet(myWallet || null);

                // 2. Fetch Transactions for Metrics
                const txResp = await dataService.transactions().getAll();
                if (txResp.data) {
                    const today = new Date().toISOString().split('T')[0];

                    // Filter for this hospital
                    const hospitalTxs = txResp.data.filter(t => t.hospital_id === CURRENT_HOSPITAL_ID);

                    // A. Last Credit (Simulated by finding last 'CREDIT' funding tx, or just Approved tx)
                    // For HERMS, let's assume 'last credit' refers to wallet funding. 
                    // Since we don't have a specific 'funding' type in Transaction yet (it's mainly for patient payments),
                    // we'll look for the most recent Approved transaction as a proxy for activity,
                    // OR if we had a specific funding log. 
                    // Let's use the most recent APPROVED transaction for now to show *income*.
                    const sortedTxs = [...hospitalTxs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    const lastIncome = sortedTxs.find(t => t.status === 'APPROVED');
                    setLastCredit(lastIncome || null);

                    // B. Today's Summary
                    const todayTxs = hospitalTxs.filter(t =>
                        t.transaction_date === today &&
                        t.status === 'APPROVED'
                    );

                    const revenue = todayTxs.reduce((sum, t) => sum + t.net_amount, 0);
                    setTodayMetrics({
                        revenue,
                        count: todayTxs.length
                    });
                }

            } catch (err) {
                console.error("Failed to load dashboard", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, [dataService]);

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Loading Dashboard...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Hospital Finance</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time financial overview and revenue management.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-primary text-white font-bold rounded-lg shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2">
                        <CreditCard size={18} /> New Payment
                    </button>
                </div>
            </div>

            {/* Module 1: Dashboard Components */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* A. Wallet Balance */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet size={80} className="text-primary" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                            <Wallet size={20} />
                        </div>
                        <h3 className="font-semibold text-slate-700 dark:text-slate-300">Institutional Balance</h3>
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                            ₦{(wallet?.total_balance || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Activity size={12} /> Live Real-time Update
                        </p>
                    </div>
                </div>

                {/* B. Last Credit / Activity */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                                <ArrowUpRight size={20} />
                            </div>
                            <h3 className="font-semibold text-slate-700 dark:text-slate-300">Last Incoming</h3>
                        </div>
                        <MoreHorizontal size={16} className="text-slate-400" />
                    </div>
                    {lastCredit ? (
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-emerald-600">
                                +₦{lastCredit.net_amount.toLocaleString()}
                            </p>
                            <div className="text-xs text-slate-500">
                                <p>Ref: <span className="font-mono">{lastCredit.transaction_ref}</span></p>
                                <p>{new Date(lastCredit.created_at).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 italic mt-4">No recent transactions</p>
                    )}
                </div>

                {/* C. Today's Summary */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                        <h3 className="font-semibold text-slate-700 dark:text-slate-300">Today's Performance</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Total Revenue</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-50">
                                ₦{todayMetrics.revenue.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Transactions</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-50">
                                {todayMetrics.count}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Placeholder for Transaction History (Module 7) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm min-h-[300px] flex items-center justify-center text-slate-400">
                <p>Transaction History Table (Module 7) to be loaded here...</p>
            </div>
        </div>
    );
};
