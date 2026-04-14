import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
    X,
    UserPlus,
    Mail,
    Shield,
    Building2,
    Loader2,
    AlertCircle,
    Lock,
    User
} from 'lucide-react';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const InviteUserModal = ({ isOpen, onClose, onSuccess }: InviteUserModalProps) => {
    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        password: '',
        hospitalId: '',
        roleId: ''
    });

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                try {
                    const [rolesRes, hospitalsRes] = await Promise.all([
                        api.get('/users/roles'),
                        currentUser?.role === 'super_admin' ? api.get('/hospitals') : Promise.resolve({ data: [] })
                    ]);

                    setRoles(rolesRes.data);
                    if (currentUser?.role === 'super_admin') {
                        setHospitals(hospitalsRes.data);
                    } else if (currentUser?.hospitalId) {
                        setFormData(prev => ({ ...prev, hospitalId: currentUser.hospitalId }));
                    }
                } catch (err) {
                    console.error('Failed to fetch modal data', err);
                    setError('Failed to load roles or hospitals');
                }
            };
            fetchData();
        }
    }, [isOpen, currentUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/users', formData);
            onSuccess();
            onClose();
            setFormData({
                email: '',
                fullName: '',
                password: '',
                hospitalId: currentUser?.role === 'super_admin' ? '' : currentUser?.hospitalId || '',
                roleId: ''
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to invite user. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-lg rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden flex flex-col">
                <div className="p-8 pb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                            <UserPlus className="h-5 w-5" />
                        </div>
                        Invite User
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-secondary rounded-2xl transition-all"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
                    {error && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                                <User className="h-3 w-3" /> Full Name
                            </label>
                            <input
                                required
                                placeholder="John Doe"
                                className="w-full px-4 py-4 bg-secondary/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                                <Mail className="h-3 w-3" /> Email Address
                            </label>
                            <input
                                required
                                type="email"
                                placeholder="user@hospital.com"
                                className="w-full px-4 py-4 bg-secondary/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                                <Lock className="h-3 w-3" /> Temporary Password
                            </label>
                            <input
                                required
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-4 py-4 bg-secondary/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                                    <Shield className="h-3 w-3" /> Assign Role
                                </label>
                                <select
                                    required
                                    className="w-full px-4 py-4 bg-secondary/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none"
                                    value={formData.roleId}
                                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                                >
                                    <option value="" disabled>Select Role</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                                    <Building2 className="h-3 w-3" /> Hospital
                                </label>
                                <select
                                    required
                                    disabled={currentUser?.role !== 'super_admin'}
                                    className="w-full px-4 py-4 bg-secondary/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none disabled:opacity-50"
                                    value={formData.hospitalId}
                                    onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
                                >
                                    <option value="" disabled>Select Hospital</option>
                                    {currentUser?.role === 'super_admin' ? (
                                        hospitals.map(h => (
                                            <option key={h.id} value={h.id}>{h.name}</option>
                                        ))
                                    ) : (
                                        <option value={currentUser?.hospitalId || ''}>
                                            Current Hospital
                                        </option>
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-secondary text-foreground font-bold rounded-2xl border border-border hover:bg-secondary/80 transition-all"
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Register User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InviteUserModal;
