import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    ShieldAlert,
    Search,
    AlertTriangle,
    CheckCircle2,
    Activity,
    Loader2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const SecurityDashboard = () => {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalAlerts: 0, highRisk: 0, resolved: 0 });

    useEffect(() => {
        const fetchSecurityData = async () => {
            try {
                setLoading(true);
                // In a real app, we'd have a specific /security/alerts endpoint
                // For now, we fetch transactions with ml_predictions
                const response = await api.get('/transactions', { params: { limit: 100 } });
                const allTxs = response.data.data;

                const flagged = allTxs.filter((tx: any) =>
                    tx.ml_predictions && tx.ml_predictions.some((p: any) => p.prediction_value?.is_anomaly)
                );

                setAlerts(flagged);
                setStats({
                    totalAlerts: flagged.length,
                    highRisk: flagged.filter((f: any) => f.ml_predictions[0]?.confidence_score > 0.8).length,
                    resolved: 0 // Placeholder
                });
            } catch (error) {
                console.error('Failed to fetch security alerts', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSecurityData();
    }, []);

    if (loading) {
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
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <div className="h-12 w-12 bg-red-500/10 rounded-2xl flex items-center justify-center">
                            <ShieldAlert className="h-7 w-7 text-red-500" />
                        </div>
                        Security & Integrity
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">Real-time Nigerian hospital fraud detection engine.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Active Alerts', value: stats.totalAlerts, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'High Risk cases', value: stats.highRisk, icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10' },
                    { label: 'Integrity Score', value: '98.4%', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                ].map((s, i) => (
                    <div key={i} className="bg-card p-6 rounded-[2.5rem] border border-border shadow-sm flex items-center gap-5">
                        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", s.bg)}>
                            <s.icon className={cn("h-7 w-7", s.color)} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{s.label}</p>
                            <h3 className="text-2xl font-black">{s.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Alerts List */}
            <div className="bg-card rounded-[2.5rem] border border-border shadow-sm overflow-hidden">
                <div className="p-8 border-b border-border flex flex-col md:flex-row gap-6 items-center justify-between">
                    <h3 className="text-xl font-black flex items-center gap-2">
                        Fraud Detection Queue
                        <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black uppercase">Live</span>
                    </h3>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Filter alerts..."
                                className="pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-border">
                    {alerts.length > 0 ? alerts.map((alert) => (
                        <div key={alert.id} className="p-6 hover:bg-secondary/20 transition-all flex flex-col md:flex-row gap-6 items-start md:items-center">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={cn(
                                        "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                        alert.ml_predictions[0]?.prediction_value?.alert_type === 'DOUBLE_BILLING' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'
                                    )}>
                                        {alert.ml_predictions[0]?.prediction_value?.alert_type || 'ANOMALY'}
                                    </span>
                                    <span className="text-xs font-bold text-muted-foreground">
                                        {new Date(alert.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <h4 className="text-lg font-black text-foreground">{alert.revenue_items?.name}</h4>
                                <p className="text-sm font-bold text-muted-foreground mt-1">
                                    Patient: {alert.patients?.full_name} • Amount: ₦{alert.amount.toLocaleString()}
                                </p>
                                <div className="mt-3 p-3 bg-background/50 rounded-xl border border-border flex items-start gap-3">
                                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                    <p className="text-xs font-medium text-foreground leading-relaxed">
                                        {alert.ml_predictions[0]?.prediction_value?.reason || 'AI detected a significant deviation from normal patterns.'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase opacity-50">Risk Confidence</span>
                                        <span className="text-sm font-black text-foreground">{(alert.ml_predictions[0]?.confidence_score * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-500"
                                            style={{ width: `${alert.ml_predictions[0]?.confidence_score * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-sm">
                                        Review details
                                    </button>
                                    <button className="p-2.5 bg-secondary text-foreground rounded-xl hover:bg-emerald-500/10 hover:text-emerald-600 transition-all border border-border">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-20 text-center text-muted-foreground flex flex-col items-center">
                            <Activity className="h-16 w-16 mb-4 opacity-20" />
                            <p className="text-lg font-black opacity-40 uppercase">System Secure</p>
                            <p className="text-sm font-medium">No fraudulent patterns detected in recent transactions.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecurityDashboard;
