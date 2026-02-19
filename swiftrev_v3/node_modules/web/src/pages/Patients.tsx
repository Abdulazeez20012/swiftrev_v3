import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
    UserPlus,
    Search,
    Phone,
    Mail,
    Calendar,
    MapPin,
    MoreVertical,
    Activity,
    History,
    X
} from 'lucide-react';

const Patients = () => {
    const { user } = useAuth();
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    // New Patient Form State
    const [newPatient, setNewPatient] = useState({
        fullName: '',
        phoneNumber: '',
        email: '',
        address: '',
        dateOfBirth: '',
        gender: 'Other'
    });

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                if (!user?.hospitalId) return;
                const response = await api.get(`/patients?hospitalId=${user.hospitalId}`);
                setPatients(response.data);
            } catch (error) {
                console.error('Failed to fetch patients', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/patients', {
                ...newPatient,
                hospitalId: user?.hospitalId
            });
            setPatients([response.data, ...patients]);
            setShowAddModal(false);
            setNewPatient({
                fullName: '',
                phoneNumber: '',
                email: '',
                address: '',
                dateOfBirth: '',
                gender: 'Other'
            });
        } catch (error) {
            console.error('Failed to register patient', error);
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
                <div className="p-6 border-b border-border bg-card/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name or phone number..."
                            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-secondary/20">
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Patient Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Contact Information</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Attributes</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Recent Activity</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredPatients.length ? filteredPatients.map((p) => (
                                <tr key={p.id} className="hover:bg-secondary/10 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm ring-2 ring-background">
                                                {p.full_name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">{p.full_name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">ID: {p.id.split('-')[0]}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                                                <Phone className="h-3 w-3 text-primary" />
                                                {p.phone_number || 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap w-40">
                                                <Mail className="h-3 w-3" />
                                                {p.email || 'No email provided'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-secondary rounded-full w-fit">
                                                <Calendar className="h-2.5 w-2.5 text-muted-foreground" />
                                                <span className="text-[10px] font-bold uppercase">{p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-secondary rounded-full w-fit">
                                                <Activity className="h-2.5 w-2.5 text-muted-foreground" />
                                                <span className="text-[10px] font-bold uppercase">{p.gender}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl w-fit">
                                            <History className="h-3 w-3 text-emerald-600" />
                                            <span className="text-[10px] font-black text-emerald-600 uppercase">Recent Visit</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button className="p-2 hover:bg-secondary rounded-xl transition-all">
                                            <MoreVertical className="h-5 w-5 text-muted-foreground" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        No patients found.
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
                    <div className="bg-card w-full max-w-xl rounded-3xl border border-border shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute right-6 top-6 p-2 hover:bg-secondary rounded-xl transition-all"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="p-8">
                            <h2 className="text-2xl font-bold mb-2">Patient Registration</h2>
                            <p className="text-muted-foreground mb-8">Enter patient demographics for medical record creation.</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</label>
                                        <input
                                            required
                                            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            value={newPatient.fullName}
                                            onChange={(e) => setNewPatient({ ...newPatient, fullName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phone Number</label>
                                        <input
                                            required
                                            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            value={newPatient.phoneNumber}
                                            onChange={(e) => setNewPatient({ ...newPatient, phoneNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</label>
                                        <input
                                            type="email"
                                            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            value={newPatient.email}
                                            onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Date of Birth</label>
                                        <input
                                            type="date"
                                            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            value={newPatient.dateOfBirth}
                                            onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                            <input
                                                className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                value={newPatient.address}
                                                onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-3 bg-secondary text-foreground font-bold rounded-2xl border border-border hover:bg-secondary/80 transition-all"
                                    >
                                        Discard Changes
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                                    >
                                        Confirm Registration
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Patients;
