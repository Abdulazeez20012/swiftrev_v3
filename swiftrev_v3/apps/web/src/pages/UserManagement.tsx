import React, { useState, useEffect } from 'react';
import { Plus, Search, Mail, Shield, MoreVertical, UserCheck, ShieldAlert, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import InviteUserModal from '../components/InviteUserModal';

interface User {
    id: string;
    name?: string;
    full_name?: string;
    email: string;
    role: string;
    status?: string;
    is_active?: boolean;
    last_login?: string;
    created_at?: string;
}

export const UserManagement: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const fetchUsers = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Use the current user's hospitalId to scope the query
            const params = currentUser?.hospitalId ? `?hospitalId=${currentUser.hospitalId}` : '';
            const response = await api.get<User[]>(`/users${params}`);
            setUsers(response.data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to fetch users.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [currentUser?.hospitalId]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filtered = users.filter(u => {
        const name = u.name || u.full_name || '';
        return (
            name.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase()) ||
            u.role?.toLowerCase().includes(search.toLowerCase())
        );
    });

    const isActive = (u: User) => u.is_active !== false && u.status !== 'suspended' && u.status !== 'inactive';

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">User Roles & Permissions</h2>
                    <p className="text-muted-foreground">Manage administrative access and system permissions.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchUsers}
                        className="px-3 py-2 bg-card border border-border rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-secondary transition-colors"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <Plus size={18} /> Invite User
                    </button>
                </div>
            </div>

            <InviteUserModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onSuccess={fetchUsers}
            />

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-secondary border-none rounded-lg text-sm focus:ring-2 focus:ring-primary w-64"
                        />
                    </div>
                    <span className="text-xs text-muted-foreground">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
                        <RefreshCw size={18} className="animate-spin" /> Loading users...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Shield size={40} className="mb-3 opacity-30" />
                        <p className="font-medium">{search ? 'No users match your search.' : 'No users found.'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-secondary/50 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Last Login</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.map(user => {
                                    const active = isActive(user);
                                    const displayName = user.name || user.full_name || user.email.split('@')[0];
                                    const displayRole = (user.role || '').replace(/_/g, ' ');
                                    const lastSeen = user.last_login
                                        ? new Date(user.last_login).toLocaleDateString()
                                        : user.created_at
                                            ? `Joined ${new Date(user.created_at).toLocaleDateString()}`
                                            : '—';
                                    return (
                                        <tr key={user.id} className="group hover:bg-secondary/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                                        {displayName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{displayName}</p>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                            <Mail size={12} /> {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Shield size={14} className="text-primary" />
                                                    <span className="text-sm capitalize">{displayRole}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center w-fit gap-1 ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {active ? <UserCheck size={10} /> : <ShieldAlert size={10} />}
                                                    {active ? 'active' : 'inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">{lastSeen}</td>
                                            <td className="px-6 py-4 text-right relative">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            if (window.confirm(`Are you sure you want to ${active ? 'suspend' : 'activate'} this user?`)) {
                                                                api.patch(`/users/${user.id}`, { status: active ? 'suspended' : 'active' })
                                                                    .then(() => fetchUsers())
                                                                    .catch(err => alert(err.message));
                                                            }
                                                        }}
                                                        className="p-2 text-muted-foreground hover:text-amber-600 transition-colors"
                                                        title={active ? "Suspend User" : "Activate User"}
                                                    >
                                                        <ShieldAlert size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            if (window.confirm('Are you sure you want to DELETE this user? This cannot be undone.')) {
                                                                api.delete(`/users/${user.id}`)
                                                                    .then(() => fetchUsers())
                                                                    .catch(err => alert(err.message));
                                                            }
                                                        }}
                                                        className="p-2 text-muted-foreground hover:text-rose-600 transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <MoreVertical size={18} />
                                                    </button>
                                                </div>
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

export default UserManagement;
