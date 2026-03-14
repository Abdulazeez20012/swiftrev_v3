import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { FileText, Layers, RefreshCw, Printer, Search, ShieldCheck } from 'lucide-react';

interface Department {
    id: string;
    name: string;
}

interface RevenueItem {
    id: string;
    name: string;
    description?: string;
    amount: number;
    nhis_amount?: number;
    payment_type?: string;
    departments?: { name: string };
}

const paymentTypeColors: Record<string, string> = {
    cash: 'bg-emerald-100 text-emerald-700',
    nhis: 'bg-blue-100 text-blue-700',
    capitation: 'bg-purple-100 text-purple-700',
    retainership: 'bg-orange-100 text-orange-700',
};

const BillingSheet = () => {
    const { user } = useAuth();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [items, setItems] = useState<RevenueItem[]>([]);
    const [activeDept, setActiveDept] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const hospitalId = user?.hospitalId;

    const fetchData = useCallback(async () => {
        if (!hospitalId) return;
        setLoading(true);
        try {
            const [deptRes, itemsRes] = await Promise.all([
                api.get(`/departments?hospitalId=${hospitalId}`),
                api.get(`/revenue-items?hospitalId=${hospitalId}`),
            ]);
            setDepartments(deptRes.data || []);
            setItems(itemsRes.data || []);
        } catch (err) {
            console.error('Failed to load billing sheet data:', err);
        } finally {
            setLoading(false);
        }
    }, [hospitalId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filtered = items.filter(item => {
        const matchDept = activeDept === 'all' || item.departments?.name === departments.find(d => d.id === activeDept)?.name;
        const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
        return matchDept && matchSearch;
    });

    // Group filtered items by department
    const groupedItems = filtered.reduce((acc, item) => {
        const deptName = item.departments?.name || 'General Services';
        if (!acc[deptName]) acc[deptName] = [];
        acc[deptName].push(item);
        return acc;
    }, {} as Record<string, RevenueItem[]>);

    // Sort department names (General Services first, then alphabetical)
    const sortedDeptNames = Object.keys(groupedItems).sort((a, b) => {
        if (a === 'General Services') return -1;
        if (b === 'General Services') return 1;
        return a.localeCompare(b);
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 no-print">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                            <FileText className="h-5 w-5" />
                        </div>
                        Billing Sheet
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Hospital service catalogue with regular and NHIS pricing.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search catalogue..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64"
                        />
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                    >
                        <Printer className="h-4 w-4" />
                        Print Sheet
                    </button>
                    <button
                        onClick={fetchData}
                        className="p-2.5 bg-secondary text-muted-foreground rounded-xl hover:text-foreground transition-all"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Department Tabs - No Print */}
            <div className="flex flex-wrap gap-2 no-print">
                <button
                    onClick={() => setActiveDept('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeDept === 'all'
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                >
                    All Departments
                </button>
                {departments.map(dept => (
                    <button
                        key={dept.id}
                        onClick={() => setActiveDept(dept.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeDept === dept.id
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Layers className="h-3.5 w-3.5" />
                        {dept.name}
                    </button>
                ))}
            </div>

            {/* NHIS legend - Always visible but styled for print */}
            <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-3xl flex items-center gap-4">
                <div className="h-10 w-10 bg-blue-600/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300">Dual Pricing Information</h3>
                    <p className="text-xs text-blue-700 dark:text-blue-400">Regular Price applies to standard cash transactions. NHIS Price applies to NHIS, Capitation, and Retainership enrollees.</p>
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center animate-pulse text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    Loading pricing catalogue...
                </div>
            ) : (
                <div className="space-y-10">
                    {sortedDeptNames.length === 0 ? (
                        <div className="bg-card rounded-3xl border border-border p-20 text-center text-muted-foreground font-bold italic">
                            No services found{search ? ` matching "${search}"` : ''}.
                        </div>
                    ) : (
                        sortedDeptNames.map(deptName => (
                            <div key={deptName} className="space-y-4">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    <h2 className="text-lg font-black tracking-tight uppercase text-foreground">
                                        {deptName}
                                    </h2>
                                    <div className="h-[1px] flex-1 bg-border" />
                                    <span className="text-[10px] font-black text-muted-foreground uppercase py-1 px-2.5 bg-secondary rounded-lg">
                                        {groupedItems[deptName].length} items
                                    </span>
                                </div>

                                <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-secondary/30">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Service / Item</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Type</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider text-right">Regular Price</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider text-right">
                                                    <span className="flex items-center justify-end gap-1.5">
                                                        <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                                                        NHIS Price
                                                    </span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {groupedItems[deptName].map(item => {
                                                const t = item.payment_type || 'cash';
                                                return (
                                                    <tr key={item.id} className="hover:bg-secondary/10 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <p className="font-bold text-sm text-foreground">{item.name}</p>
                                                            {item.description && (
                                                                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[400px]">{item.description}</p>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${paymentTypeColors[t] || 'bg-secondary text-foreground'}`}>
                                                                {t}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="font-bold text-sm text-foreground">
                                                                ₦{Number(item.amount || 0).toLocaleString()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {item.nhis_amount ? (
                                                                <span className="font-bold text-sm text-blue-600">
                                                                    ₦{Number(item.nhis_amount).toLocaleString()}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-muted-foreground italic font-medium">Standard Price</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Print styles */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white; padding: 0 !important; }
                    .space-y-8 { space-y-4 !important; }
                    .space-y-10 { space-y-6 !important; }
                    .rounded-3xl { border-radius: 0.5rem !important; border: 1px solid #e2e8f0 !important; }
                    .shadow-sm, .shadow-lg { shadow: none !important; }
                    .bg-card { background: white !important; }
                    h1 { font-size: 1.5rem !important; }
                    h2 { font-size: 1.1rem !important; color: black !important; }
                    th { font-size: 8px !important; color: #64748b !important; }
                    td { font-size: 10px !important; }
                    .bg-blue-50/50 { background-color: #f8fafc !important; border-color: #e2e8f0 !important; }
                    .text-blue-900 { color: #1e3a8a !important; }
                    .text-blue-700 { color: #1d4ed8 !important; }
                }
            `}</style>
        </div>
    );
};

export default BillingSheet;
