import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
    Activity,
    LayoutDashboard,
    Receipt,
    Users,
    Settings,
    LogOut,
    Menu,
    Hospital,
    ChevronRight,
    TrendingUp,
    CreditCard,
    Tag,
    ShieldCheck,
    ShieldAlert,
    Building2,
    Wallet,
    DollarSign,
    ArrowLeftRight,
    UserCog
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
    <Link
        to={to}
        className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
            active
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
    >
        <Icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", active ? "text-primary-foreground" : "text-muted-foreground")} />
        <span className="font-medium">{label}</span>
        {active && <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-primary-foreground animate-pulse" />}
    </Link>
);

import { syncManager } from '../services/SyncManager';

const MainLayout = () => {
    const { user, logout, switchHospital } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'syncing'>('online');
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        syncManager.addListener((status, count) => {
            setSyncStatus(status);
            setPendingCount(count);
        });

        if (user?.role === 'super_admin') {
            const fetchHospitals = async () => {
                try {
                    const response = await api.get('/hospitals');
                    setHospitals(response.data);
                } catch (error) {
                    console.error('Failed to fetch hospitals', error);
                }
            };
            fetchHospitals();
        }
    }, [user]);

    const currentHospitalName = hospitals.find(h => h.id === user?.hospitalId)?.name || "St. Joseph's Medical Center";

    const coreMenuItems = [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/transactions', label: 'Transactions', icon: Receipt },
        { to: '/patients', label: 'Patients', icon: Users },
        { to: '/revenue-items', label: 'Services & Items', icon: Tag },
    ];

    const financeMenuItems = [
        { to: '/payments', label: 'Payments', icon: DollarSign },
        { to: '/finance', label: 'Finance & Wallets', icon: Wallet },
        { to: '/reconciliation', label: 'Reconciliation', icon: ArrowLeftRight },
        { to: '/claims', label: 'NHIS Claims', icon: ShieldCheck },
    ];

    const adminMenuItems = [
        { to: '/hospitals', label: 'Hospitals', icon: Building2 },
        { to: '/users', label: 'User Management', icon: UserCog },
        { to: '/security', label: 'Security & Alerts', icon: ShieldAlert },
        { to: '/settings', label: 'Settings', icon: Settings },
    ];

    if (user?.role === 'super_admin' || user?.role === 'hospital_admin') {
        adminMenuItems.push({ to: '/admin', label: 'Admin Panel', icon: CreditCard });
    }

    const menuItems = [...coreMenuItems, ...financeMenuItems, ...adminMenuItems];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 transition-transform duration-300 transform md:relative md:translate-x-0 overflow-y-auto shadow-sm",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-8">
                        <img
                            src="/logo.jpg"
                            alt="SwiftRev Logo"
                            className="h-10 w-auto rounded-lg shadow-sm"
                        />
                        <div className="hidden group-hover:block transition-all duration-300">
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest leading-none">Management System</p>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {menuItems.map((item) => (
                            <SidebarItem
                                key={item.to}
                                to={item.to}
                                icon={item.icon}
                                label={item.label}
                                active={location.pathname === item.to}
                            />
                        ))}
                    </nav>
                </div>

                <div className="absolute bottom-0 w-full p-6 border-t border-border bg-card/80 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-6 p-2 rounded-xl bg-secondary/50 border border-border/50">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-xs ring-2 ring-background">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate text-foreground">{user?.email?.split('@')[0]}</p>
                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider truncate">{user?.role?.replace('_', ' ')}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-200 group"
                    >
                        <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                        <span className="font-semibold text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm">
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-secondary"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                        <Hospital className="h-4 w-4" />
                        {user?.role === 'super_admin' ? (
                            <select
                                className="bg-transparent text-foreground font-bold border-none focus:ring-0 cursor-pointer hover:text-primary transition-colors text-sm"
                                value={user?.hospitalId}
                                onChange={(e) => switchHospital(e.target.value)}
                            >
                                {hospitals.map(h => (
                                    <option key={h.id} value={h.id} className="bg-card text-foreground">{h.name}</option>
                                ))}
                                {hospitals.length === 0 && <option>{currentHospitalName}</option>}
                            </select>
                        ) : (
                            <span className="font-medium text-foreground">{currentHospitalName}</span>
                        )}
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-foreground font-bold">{menuItems.find(i => i.to === location.pathname)?.label || 'Overview'}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Status'}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <div className={cn(
                                    "h-2 w-2 rounded-full animate-pulse",
                                    syncStatus === 'online' && "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
                                    syncStatus === 'offline' && "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]",
                                    syncStatus === 'syncing' && "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                )} />
                                <span className="text-xs font-bold text-foreground">
                                    {syncStatus === 'online' ? 'Online' : syncStatus === 'offline' ? 'Offline' : 'Syncing'}
                                    {pendingCount > 0 && <span className="ml-1 text-[10px] text-muted-foreground">({pendingCount} pending)</span>}
                                </span>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-border hidden sm:block mx-1" />
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/20">
                            {syncStatus === 'offline' ? (
                                <>
                                    <Activity className="h-4 w-4 text-orange-500" />
                                    <span className="text-xs font-bold text-orange-500">Field Mode</span>
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-bold text-primary">Live Updates</span>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto overflow-x-hidden">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
