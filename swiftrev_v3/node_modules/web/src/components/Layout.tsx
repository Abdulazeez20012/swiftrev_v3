
import React from 'react';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-950 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col">
                <div className="p-6">
                    <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2">
                        {/* <ShieldCheck className="w-8 h-8" /> */}
                        SwiftRev
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <NavItem to="/dashboard" icon={<LayoutDashboard />} label="Dashboard" />
                    {/* 
                    <NavItem to="/hospitals" icon={<Building2 />} label="Hospitals" />
                    <NavItem to="/users" icon={<Users />} label="Users & Roles" />
                    <NavItem to="/finance" icon={<Building2 />} label="Finance & Funding" />
                    <NavItem to="/reconciliation" icon={<Repeat />} label="Reconciliation" />
                    <NavItem to="/payments" icon={<CreditCard />} label="Payments" />
                    <NavItem to="/settings" icon={<Settings />} label="Settings" />
                    */}
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-slate-800">
                    <NavItem to="/logout" icon={<LogOut />} label="Logout" />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
};

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
    const location = useLocation();
    const active = location.pathname.startsWith(to);

    return (
        <Link
            to={to}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active
                ? 'bg-primary/10 text-primary'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`}
        >
            {React.cloneElement(icon as React.ReactElement, { size: 20 })}
            {label}
        </Link>
    );
};
