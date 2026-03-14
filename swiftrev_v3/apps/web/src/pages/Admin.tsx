import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
    Building2,
    Users,
    Layers,
    Plus,
    MoreVertical,
    Edit,
    ShieldCheck,
    Tag,
    TrendingUp,
    FileText,
    ChevronRight,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import CreateDepartmentModal from '../components/CreateDepartmentModal';
import InviteUserModal from '../components/InviteUserModal';
import OnboardHospitalModal from '../components/OnboardHospitalModal';
import AddRevenueItemModal from '../components/AddRevenueItemModal';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- Sub-components ---

const ManageDepartments = ({ hospitalId }: { hospitalId: string }) => {
    const [departments, setDepartments] = useState<any[]>([]); // Keep any for now or define Dept interface
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/departments?hospitalId=${hospitalId}`);
            setDepartments(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [hospitalId]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    if (loading) return <div className="py-20 text-center animate-pulse text-sm font-bold text-muted-foreground uppercase tracking-widest">Loading departments...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Departments</h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20"
                >
                    <Plus className="h-4 w-4" />
                    Create Department
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.length ? departments.map((dept) => (
                    <div key={dept.id} className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:border-primary/50 transition-all flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                <Layers className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-bold text-foreground">{dept.name}</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{dept.id.split('-')[0]}</p>
                            </div>
                        </div>
                        <button className="p-2 hover:bg-secondary rounded-lg">
                            <MoreVertical className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </div>
                )) : (
                    <div className="col-span-full py-10 text-center text-muted-foreground bg-secondary/20 rounded-2xl border border-dashed border-border font-bold">
                        No departments found for this hospital.
                    </div>
                )}
            </div>

            <CreateDepartmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchItems}
            />
        </div>
    );
};

const ManageUsers = ({ hospitalId, role }: { hospitalId: string, role: string }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const endpoint = role === 'super_admin' ? '/users' : `/users?hospitalId=${hospitalId}`;
            const res = await api.get(endpoint);
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [hospitalId, role]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    if (loading) return <div className="py-20 text-center animate-pulse text-sm font-bold text-muted-foreground uppercase tracking-widest">Loading users...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">User Management</h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20"
                >
                    <Plus className="h-4 w-4" />
                    Invite User
                </button>
            </div>

            <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-secondary/30">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">User</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Role</th>
                            {role === 'super_admin' && <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Hospital</th>}
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-secondary/10 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                                            {u.email.charAt(0)}
                                        </div>
                                        <span className="font-medium text-sm text-foreground">{u.email}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-secondary rounded-lg text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        {(u.roles?.name || 'unknown').replace('_', ' ')}
                                    </span>
                                </td>
                                {role === 'super_admin' && (
                                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                                        {u.hospitals?.name || 'Globally Appointed'}
                                    </td>
                                )}
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 hover:bg-secondary rounded-lg text-muted-foreground">
                                        <Edit className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <InviteUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchUsers}
            />
        </div>
    );
};

const ManageHospitals = () => {
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchHospitals = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/hospitals');
            setHospitals(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHospitals();
    }, [fetchHospitals]);

    if (loading) return <div className="py-20 text-center animate-pulse text-sm font-bold text-muted-foreground uppercase tracking-widest">Loading hospitals...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Hospital Directory</h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20"
                >
                    <Plus className="h-4 w-4" />
                    Onboard Hospital
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hospitals.map((h) => (
                    <div key={h.id} className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:border-primary/50 transition-all flex flex-col group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-10 w-10 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <button className="p-2 hover:bg-secondary rounded-lg">
                                <MoreVertical className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>
                        <h4 className="font-bold text-lg text-foreground">{h.name}</h4>
                        <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-widest">{h.id.split('-')[0]}</p>
                        <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full ring-1 ring-emerald-500/20">Active Tenant</span>
                            <span className="text-xs font-bold text-muted-foreground transition-all group-hover:text-primary group-hover:translate-x-1 flex items-center gap-1 cursor-pointer">
                                View Analytics <ChevronRight className="h-3 w-3" />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <OnboardHospitalModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchHospitals}
            />
        </div>
    );
};

const ManageRevenueItems = ({ hospitalId }: { hospitalId: string }) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchRevenueItems = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/revenue-items?hospitalId=${hospitalId}`);
            setItems(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [hospitalId]);

    useEffect(() => {
        fetchRevenueItems();
    }, [fetchRevenueItems]);

    if (loading) return <div className="py-20 text-center animate-pulse text-sm font-bold text-muted-foreground uppercase tracking-widest">Accessing pricing data...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Revenue Configuration</h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                    <Plus className="h-4 w-4" />
                    Add Billing Item
                </button>
            </div>

            <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-secondary/30">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Service Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Department</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Amount</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {items.map((i) => (
                            <tr key={i.id} className="hover:bg-secondary/10 transition-colors">
                                <td className="px-6 py-4 text-sm font-bold text-foreground">{i.name}</td>
                                <td className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">{i.departments?.name || 'General'}</td>
                                <td className="px-6 py-4 text-sm font-black text-primary">₦{i.amount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 hover:bg-secondary rounded-lg text-muted-foreground">
                                        <Edit className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AddRevenueItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchRevenueItems}
            />
        </div>
    );
};

const FinancialReports = ({ hospitalId }: { hospitalId: string }) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get(`/reports/revenue-summary?hospitalId=${hospitalId}`);
            setStats(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [hospitalId]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const totalRevenue = stats?.totalRevenue || 0;
    const maxRevenue = Math.max(...(stats?.data?.map((s: any) => s.amount) || [1]));

    if (loading) return (
        <div className="h-64 flex items-center justify-center bg-card rounded-3xl border border-border animate-pulse">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading Analytics...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Financial Performance</h3>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-secondary text-foreground text-xs font-bold rounded-xl border border-border">Last 7 Days</button>
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-lg shadow-primary/20"
                    >
                        Print Summary
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-card p-6 rounded-3xl border border-border shadow-sm h-64 flex flex-col justify-between">
                    <h4 className="font-bold text-muted-foreground uppercase text-xs tracking-widest">Revenue Velocity</h4>
                    <div className="flex-1 flex items-end gap-2 pb-2">
                        {stats?.data ? stats.data.map((s: any, i: number) => (
                            <div key={i} className="flex-1 bg-primary/20 rounded-t-lg relative group" style={{ height: `${(s.amount / maxRevenue) * 100}%` }}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                                    ₦{s.amount.toLocaleString()}
                                </div>
                            </div>
                        )) : (
                            <div className="w-full flex items-center justify-center text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
                                Calculating Velocity...
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-border">
                        <p className="text-2xl font-black">₦{totalRevenue.toLocaleString()}</p>
                        <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Growth Detected
                        </span>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-3xl border border-border shadow-sm h-64 flex flex-col justify-between">
                    <h4 className="font-bold text-muted-foreground uppercase text-xs tracking-widest">Efficiency Metrics</h4>
                    <div className="flex-1 flex items-center justify-center relative">
                        <div className="h-24 w-24 rounded-full border-8 border-primary border-t-secondary shadow-lg relative flex items-center justify-center">
                            <ShieldCheck className="h-8 w-8 text-primary/20 absolute" />
                        </div>
                        <div className="absolute text-center flex flex-col items-center justify-center">
                            <p className="text-lg font-black leading-none">High</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Audit Score</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-border">
                        <p className="text-2xl font-black">Verified</p>
                        <span className="text-xs font-bold text-primary italic">Compliance Secure</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AuditLogs = ({ hospitalId }: { hospitalId: string }) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAuditLogs = useCallback(async () => {
        try {
            const res = await api.get(hospitalId ? `/audit?hospitalId=${hospitalId}` : '/audit');
            setLogs(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [hospitalId]);

    useEffect(() => {
        fetchAuditLogs();
    }, [fetchAuditLogs]);

    if (loading) return <div className="py-20 text-center animate-pulse text-sm font-bold text-muted-foreground uppercase tracking-widest">Scanning Audit Trail...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h3 className="text-xl font-bold">System Audit Trail</h3>
            <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-secondary/30">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Timestamp</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">User</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Action</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Target</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {logs.length ? logs.map((L) => (
                            <tr key={L.id} className="hover:bg-secondary/10 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="text-xs font-bold text-foreground">{new Date(L.created_at).toLocaleDateString()}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">{new Date(L.created_at).toLocaleTimeString()}</p>
                                </td>
                                <td className="px-6 py-4 text-xs font-medium">{L.user?.email || 'System'}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-0.5 bg-primary/5 text-primary text-[10px] font-black uppercase rounded-lg border border-primary/20">
                                        {L.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase italic truncate max-w-[150px]">
                                    {L.metadata?.target_id || 'Global Context'}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground font-bold italic">
                                    No audit logs recorded for this period.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Main Component ---

const AdminPanel = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('users');

    const tabs = [
        { id: 'users', label: 'Users', icon: Users, roles: ['super_admin', 'hospital_admin'] },
        { id: 'departments', label: 'Departments', icon: Layers, roles: ['hospital_admin', 'super_admin'] },
        { id: 'revenue', label: 'Revenue Items', icon: Tag, roles: ['hospital_admin', 'super_admin'] },
        { id: 'reports', label: 'Reports', icon: TrendingUp, roles: ['hospital_admin', 'super_admin', 'finance_admin'] },
        { id: 'audit', label: 'Audit Trail', icon: FileText, roles: ['super_admin', 'auditor'] },
        { id: 'hospitals', label: 'Hospitals', icon: Building2, roles: ['super_admin'] },
    ];

    const visibleTabs = tabs.filter(t => t.roles.includes(user?.role || ''));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-4">
                        <ShieldCheck className="h-10 w-10 text-primary" />
                        Administration
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg font-medium">System configuration and access control panel.</p>
                </div>

                <div className="flex flex-wrap p-1 bg-secondary rounded-[2rem] border border-border w-fit shadow-inner">
                    {visibleTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-[1.25rem] text-xs font-bold transition-all duration-300",
                                activeTab === tab.id
                                    ? "bg-card text-foreground shadow-md ring-1 ring-border"
                                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                            )}
                        >
                            <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-primary" : "")} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border p-8 rounded-[3rem] shadow-sm">
                {activeTab === 'users' && <ManageUsers hospitalId={user?.hospitalId || ''} role={user?.role || ''} />}
                {activeTab === 'departments' && <ManageDepartments hospitalId={user?.hospitalId || ''} />}
                {activeTab === 'revenue' && <ManageRevenueItems hospitalId={user?.hospitalId || ''} />}
                {activeTab === 'reports' && <FinancialReports hospitalId={user?.hospitalId || ''} />}
                {activeTab === 'audit' && <AuditLogs hospitalId={user?.hospitalId || ''} />}
                {activeTab === 'hospitals' && <ManageHospitals />}
            </div>
        </div>
    );
};

export default AdminPanel;
