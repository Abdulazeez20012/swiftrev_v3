import { useState } from 'react';
import api from '../services/api';
import {
    X,
    Building2,
    MapPin,
    Phone,
    Loader2,
    AlertCircle
} from 'lucide-react';

interface OnboardHospitalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const OnboardHospitalModal = ({ isOpen, onClose, onSuccess }: OnboardHospitalModalProps) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        contactInfo: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/hospitals', formData);
            onSuccess();
            onClose();
            setFormData({ name: '', address: '', contactInfo: '' });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to onboard hospital. Please try again.');
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
                            <Building2 className="h-5 w-5" />
                        </div>
                        Onboard Hospital
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
                                <Building2 className="h-3 w-3" /> Hospital Name
                            </label>
                            <input
                                required
                                placeholder="General Hospital Lagos"
                                className="w-full px-4 py-4 bg-secondary/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                                <MapPin className="h-3 w-3" /> Physical Address
                            </label>
                            <input
                                required
                                placeholder="123 Health Street, Victoria Island"
                                className="w-full px-4 py-4 bg-secondary/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                                <Phone className="h-3 w-3" /> Contact Information
                            </label>
                            <input
                                required
                                placeholder="Email or Phone Number"
                                className="w-full px-4 py-4 bg-secondary/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                value={formData.contactInfo}
                                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                            />
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
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Register Hospital'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OnboardHospitalModal;
