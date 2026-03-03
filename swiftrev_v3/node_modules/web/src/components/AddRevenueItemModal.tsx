import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
    X,
    Tag,
    Layers,
    DollarSign,
    Loader2,
    AlertCircle,
    FileText
} from 'lucide-react';

interface AddRevenueItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddRevenueItemModal = ({ isOpen, onClose, onSuccess }: AddRevenueItemModalProps) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [departments, setDepartments] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        amount: '',
        departmentId: ''
    });

    useEffect(() => {
        if (isOpen) {
            const fetchDepartments = async () => {
                try {
                    const res = await api.get(`/departments?hospitalId=${user?.hospitalId}`);
                    setDepartments(res.data);
                    if (res.data.length > 0) {
                        setFormData(prev => ({ ...prev, departmentId: res.data[0].id }));
                    }
                } catch (err) {
                    console.error('Failed to fetch departments', err);
                }
            };
            fetchDepartments();
        }
    }, [isOpen, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/revenue-items', {
                ...formData,
                amount: parseFloat(formData.amount),
                hospitalId: user?.hospitalId
            });
            onSuccess();
            onClose();
            setFormData({
                name: '',
                description: '',
                amount: '',
                departmentId: departments[0]?.id || ''
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create item. Please try again.');
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
                            <Tag className="h-5 w-5" />
                        </div>
                        Add Billing Item
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
                                <Tag className="h-3 w-3" /> Item Name
                            </label>
                            <input
                                required
                                placeholder="Consultation, Lab Test, etc."
                                className="w-full px-4 py-4 bg-secondary/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                                <FileText className="h-3 w-3" /> Description
                            </label>
                            <textarea
                                placeholder="Brief details about this service..."
                                className="w-full px-4 py-4 bg-secondary/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none resize-none h-24"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                                    <DollarSign className="h-3 w-3" /> Amount (₦)
                                </label>
                                <input
                                    required
                                    type="number"
                                    placeholder="0.00"
                                    className="w-full px-4 py-4 bg-secondary/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                                    <Layers className="h-3 w-3" /> Department
                                </label>
                                <select
                                    required
                                    className="w-full px-4 py-4 bg-secondary/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none"
                                    value={formData.departmentId}
                                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                >
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
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
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddRevenueItemModal;
