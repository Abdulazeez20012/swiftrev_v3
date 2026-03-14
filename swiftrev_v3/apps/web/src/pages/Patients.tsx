import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
    UserPlus,
    Search,
    Phone,
    Mail,
    Calendar,
    MoreVertical,
    Activity,
    X,
    WifiOff,
    CheckCircle2
} from 'lucide-react';
import { syncManager } from '../services/SyncManager';
import { offlineStorage } from '../services/OfflineStorage';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const Patients = () => {
    const { user } = useAuth();
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isOfflineSaved, setIsOfflineSaved] = useState(false);

    // New Patient Form State
    const [newPatient, setNewPatient] = useState({
        fullName: '',
        phoneNumber: '',
        email: '',
        address: '',
        dateOfBirth: '',
        gender: 'Other',
        patientType: 'regular',
    });

    const fetchPatients = async () => {
        if (!user?.hospitalId) return;

        if (syncManager.isOnline()) {
            try {
                const response = await api.get(`/patients?hospitalId=${user.hospitalId}`);
                setPatients(response.data);
                await offlineStorage.updateCache('patients', response.data);
            } catch (error) {
                console.error('Failed to fetch patients, falling back to cache', error);
                const cached = await offlineStorage.getAll('patients');
                setPatients(cached);
            } finally {
                setLoading(false);
            }
        } else {
            const cached = await offlineStorage.getAll('patients');
            setPatients(cached);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const patientData = {
            ...newPatient,
            hospitalId: user?.hospitalId
        };

        try {
            if (!syncManager.isOnline()) {
                await syncManager.queueOffline('patient', patientData);
                // Optimistically add to local list with a temporary ID
                const tempPatient = {
                    ...patientData,
                    id: `temp-${Date.now()}`,
                    full_name: patientData.fullName,
                    phone_number: patientData.phoneNumber,
                    isOffline: true
                };
                setPatients([tempPatient, ...patients]);
                setIsOfflineSaved(true);
                setTimeout(() => {
                    setShowAddModal(false);
                    setIsOfflineSaved(false);
                }, 2000);
                return;
            }

            const response = await api.post('/patients', patientData);
            setPatients([response.data, ...patients]);
            setShowAddModal(false);
            setNewPatient({
                fullName: '',
                phoneNumber: '',
                email: '',
                address: '',
                dateOfBirth: '',
                gender: 'Other',
                patientType: 'regular',
            });
        } catch (error: any) {
            if (!error.response && !syncManager.isOnline()) {
                await syncManager.queueOffline('patient', patientData);
                setIsOfflineSaved(true);
                setTimeout(() => {
                    setShowAddModal(false);
                    setIsOfflineSaved(false);
                }, 2000);
            } else {
                console.error('Failed to register patient', error);
            }
        }
    };

    const filteredPatients = patients.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone_number?.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Patient Registry</h1>
                    <p className="text-muted-foreground mt-1 text-lg">Central hub for patient information and visit history.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:-translate-y-0.5"
                >
                    <UserPlus className="h-5 w-5" />
                    Register New Patient
                </button>
            </div>

            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-border bg-card/50 px-8 flex items-center justify-between">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name or phone number..."
                            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {!syncManager.isOnline() && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                            <WifiOff className="h-4 w-4 text-orange-500" />
                            <span className="text-xs font-bold text-orange-500 uppercase tracking-tight">Offline Mode</span>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left font-medium">
                        <thead>
                            <tr className="bg-secondary/20">
                                <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Patient Details</th>
                                <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Contact Information</th>
                                <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Attributes</th>
                                <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Patient Type</th>
                                <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredPatients.length ? filteredPatients.map((p) => (
                                <tr key={p.id} className="hover:bg-secondary/10 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-12 w-12 rounded-full flex items-center justify-center font-bold shadow-sm ring-2 ring-background text-lg",
                                                p.isOffline ? "bg-orange-500/10 text-orange-500" : "bg-primary/10 text-primary"
                                            )}>
                                                {p.full_name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-foreground">{p.full_name}</p>
                                                    {p.isOffline && (
                                                        <span className="px-1.5 py-0.5 bg-orange-500/10 text-[8px] font-black text-orange-500 uppercase rounded border border-orange-500/20">Pending Sync</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">ID: {p.id.toString().split('-')[0]}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                                                <Phone className="h-3.5 w-3.5 text-primary" />
                                                {p.phone_number || 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold">
                                                <Mail className="h-3.5 w-3.5" />
                                                {p.email || 'No email provided'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2 px-2.5 py-1 bg-secondary/50 rounded-xl w-fit border border-border/50">
                                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-[10px] font-black uppercase">{p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-2.5 py-1 bg-secondary/50 rounded-xl w-fit border border-border/50">
                                                <Activity className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-[10px] font-black uppercase text-secondary-foreground">{p.gender}</span>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Patient Type Badge */}
                                    <td className="px-8 py-5">
                                        {(() => {
                                            const typeMap: Record<string, string> = {
                                                regular: 'bg-emerald-100 text-emerald-700',
                                                nhis: 'bg-blue-100 text-blue-700',
                                                retainer: 'bg-amber-100 text-amber-700',
                                                capitation: 'bg-purple-100 text-purple-700',
                                            };
                                            const t = p.patient_type || 'regular';
                                            return (
                                                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${typeMap[t] || 'bg-secondary text-foreground'}`}>
                                                    {t}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="p-2 hover:bg-secondary rounded-xl transition-all">
                                            <MoreVertical className="h-5 w-5 text-muted-foreground" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Search className="h-10 w-10 text-muted-foreground/30" />
                                            <p className="text-muted-foreground font-bold">No patients found matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Patient Modal System */}
            {showAddModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-xl rounded-[2.5rem] border border-border shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden">
                        {isOfflineSaved ? (
                            <div className="p-12 text-center space-y-6 animate-in zoom-in duration-500">
                                <div className="h-24 w-24 bg-orange-500 rounded-full flex items-center justify-center text-white mx-auto shadow-xl shadow-orange-500/20">
                                    <WifiOff className="h-12 w-12" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black mb-2">Saved Offline</h2>
                                    <p className="text-muted-foreground text-lg">Patient data will sync automatically when your connection is restored.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="absolute right-6 top-6 p-2 hover:bg-secondary rounded-2xl transition-all z-10"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                                <div className="p-10">
                                    <div className="mb-10">
                                        <h2 className="text-3xl font-black tracking-tight mb-2">Patient Registry</h2>
                                        <p className="text-muted-foreground font-medium">Create a new digital medical record.</p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Full Name</label>
                                                <input
                                                    required
                                                    className="w-full px-5 py-4 bg-secondary/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none font-bold"
                                                    value={newPatient.fullName}
                                                    placeholder="John Doe"
                                                    onChange={(e) => setNewPatient({ ...newPatient, fullName: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Phone Number</label>
                                                <input
                                                    required
                                                    className="w-full px-5 py-4 bg-secondary/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none font-bold"
                                                    value={newPatient.phoneNumber}
                                                    placeholder="+234..."
                                                    onChange={(e) => setNewPatient({ ...newPatient, phoneNumber: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Email</label>
                                                <input
                                                    type="email"
                                                    className="w-full px-5 py-4 bg-secondary/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none font-bold"
                                                    value={newPatient.email}
                                                    placeholder="john@example.com"
                                                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Date of Birth</label>
                                                <input
                                                    type="date"
                                                    className="w-full px-5 py-4 bg-secondary/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none font-bold"
                                                    value={newPatient.dateOfBirth}
                                                    onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2.5 md:col-span-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Patient Type</label>
                                                <select
                                                    className="w-full px-5 py-4 bg-secondary/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none font-bold appearance-none"
                                                    value={newPatient.patientType}
                                                    onChange={(e) => setNewPatient({ ...newPatient, patientType: e.target.value })}
                                                >
                                                    <option value="regular">🟢 Regular (Cash)</option>
                                                    <option value="nhis">🟦 NHIS</option>
                                                    <option value="retainer">🟡 Retainership</option>
                                                    <option value="capitation">🟣 Capitation</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowAddModal(false)}
                                                className="flex-1 py-4 bg-secondary text-foreground font-bold rounded-[1.25rem] border border-border hover:bg-secondary/80 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex-2 py-4 bg-primary text-primary-foreground font-black rounded-[1.25rem] shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 className="h-5 w-5" />
                                                Register Patient
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Patients;
