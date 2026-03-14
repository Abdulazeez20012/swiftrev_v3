import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Building2, MapPin, Users, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../services/api';

interface Hospital {
    id: string;
    name: string;
    location?: string;
    address?: string;
    staff_count?: number;
    staffCount?: number;
    status?: string;
    is_active?: boolean;
    created_at?: string;
}

export const HospitalManagement: React.FC = () => {
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const fetchHospitals = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<Hospital[]>('/hospitals');
            setHospitals(response.data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to fetch hospitals.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHospitals();
    }, [fetchHospitals]);

    const filtered = hospitals.filter(h =>
        h.name?.toLowerCase().includes(search.toLowerCase()) ||
        (h.location || h.address || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Hospital Management</h2>
                    <p className="text-muted-foreground">Manage registered hospitals and administrative staff.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchHospitals}
                        className="px-3 py-2 bg-card border border-border rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-secondary transition-colors"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
                        <Plus size={18} /> Add Hospital
                    </button>
                </div>
            </div>

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
                            placeholder="Search hospitals..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-secondary border-none rounded-lg text-sm focus:ring-2 focus:ring-primary w-64"
                        />
                    </div>
                    <span className="text-xs text-muted-foreground">{filtered.length} hospital{filtered.length !== 1 ? 's' : ''}</span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
                        <RefreshCw size={18} className="animate-spin" /> Loading hospitals...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Building2 size={40} className="mb-3 opacity-30" />
                        <p className="font-medium">{search ? 'No hospitals match your search.' : 'No hospitals registered yet.'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-secondary/50 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    <th className="px-6 py-4">Hospital Name</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Staff</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Registered</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.map(hospital => {
                                    const isActive = hospital.is_active !== false && hospital.status !== 'inactive';
                                    return (
                                        <tr key={hospital.id} className="group hover:bg-secondary/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                                        <Building2 size={18} />
                                                    </div>
                                                    <span className="font-semibold">{hospital.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <MapPin size={14} />
                                                    {hospital.location || hospital.address || '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Users size={14} />
                                                    {hospital.staff_count ?? hospital.staffCount ?? '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {isActive ? 'active' : 'inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">
                                                {hospital.created_at ? new Date(hospital.created_at).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 text-muted-foreground hover:text-foreground">
                                                    <MoreVertical size={18} />
                                                </button>
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

export default HospitalManagement;
