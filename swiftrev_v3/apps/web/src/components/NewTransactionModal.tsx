import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
    X,
    Search,
    Tag,
    CreditCard,
    ChevronRight,
    CheckCircle2,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface NewTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const NewTransactionModal = ({ isOpen, onClose, onSuccess }: NewTransactionModalProps) => {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Data
    const [patients, setPatients] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [searchPatient, setSearchPatient] = useState('');
    const [searchItem, setSearchItem] = useState('');

    // Selection
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                try {
                    const [pRes, iRes] = await Promise.all([
                        api.get(`/patients?hospitalId=${user?.hospitalId}`),
                        api.get(`/revenue-items?hospitalId=${user?.hospitalId}`)
                    ]);
                    setPatients(pRes.data);
                    setItems(iRes.data);
                } catch (err) {
                    console.error('Failed to pre-fetch data', err);
                }
            };
            fetchData();
        }
    }, [isOpen, user]);

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            await api.post('/transactions', {
                hospitalId: user?.hospitalId,
                patientId: selectedPatient.id,
                revenueItemId: selectedItem.id,
                amount: selectedItem.amount,
                paymentMethod,
                offlineId: crypto.randomUUID()
            });
            onSuccess();
            setStep(4);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Transaction failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-xl rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 pb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            New Payment
                        </h2>
                        <div className="flex gap-2 mt-4">
                            {[1, 2, 3].map((s) => (
                                <div
                                    key={s}
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-500",
                                        step === s ? "w-8 bg-primary" : "w-4 bg-secondary"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-secondary rounded-2xl transition-all"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pt-4">
                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2 px-1">Search Patient</label>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Enter name or patient ID..."
                                        className="w-full pl-10 pr-4 py-4 bg-secondary/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none text-lg font-medium"
                                        autoFocus
                                        value={searchPatient}
                                        onChange={(e) => setSearchPatient(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                {patients
                                    .filter(p => p.full_name?.toLowerCase().includes(searchPatient.toLowerCase()))
                                    .map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => { setSelectedPatient(p); setStep(2); }}
                                            className="w-full p-4 flex items-center gap-4 bg-card border border-border rounded-2xl hover:border-primary hover:bg-primary/5 transition-all text-left group"
                                        >
                                            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-bold group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                                {p.full_name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-foreground">{p.full_name}</p>
                                                <p className="text-xs text-muted-foreground">{p.phone_number || 'No contact info'}</p>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                                        </button>
                                    ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-2xl border border-primary/20 mb-6">
                                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs ring-2 ring-background">
                                    {selectedPatient?.full_name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-primary uppercase tracking-tighter leading-none mb-1">Billing For</p>
                                    <p className="text-sm font-bold truncate text-foreground leading-none">{selectedPatient?.full_name}</p>
                                </div>
                                <button
                                    onClick={() => setStep(1)}
                                    className="ml-auto text-xs font-bold text-primary hover:underline"
                                >
                                    Change
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search services..."
                                        className="w-full pl-10 pr-4 py-4 bg-secondary/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                        value={searchItem}
                                        onChange={(e) => setSearchItem(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                    {items
                                        .filter(i => i.name.toLowerCase().includes(searchItem.toLowerCase()))
                                        .map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => { setSelectedItem(item); setStep(3); }}
                                                className="p-4 flex items-center justify-between bg-card border border-border rounded-2xl hover:border-primary transition-all text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Tag className="h-5 w-5 text-muted-foreground" />
                                                    <div>
                                                        <p className="font-bold text-foreground">{item.name}</p>
                                                        <p className="text-[10px] text-muted-foreground font-bold uppercase">{item.departments?.name || 'General'}</p>
                                                    </div>
                                                </div>
                                                <p className="font-black text-primary">₦{item.amount.toLocaleString()}</p>
                                            </button>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-secondary/30 p-6 rounded-3xl border border-border/50">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Patient</p>
                                        <h4 className="font-bold">{selectedPatient?.full_name}</h4>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Service</p>
                                        <h4 className="font-bold text-right">{selectedItem?.name}</h4>
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-dashed border-border flex justify-between items-center">
                                    <p className="text-sm font-bold text-muted-foreground uppercase">Total Amount</p>
                                    <p className="text-3xl font-black text-foreground tracking-tighter">₦{selectedItem?.amount.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Payment Method</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {['cash', 'transfer', 'card', 'pos'].map((method) => (
                                        <button
                                            key={method}
                                            onClick={() => setPaymentMethod(method)}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 transition-all font-bold capitalize text-sm",
                                                paymentMethod === method
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "border-border text-muted-foreground hover:bg-secondary"
                                            )}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex-1 py-4 bg-secondary text-foreground font-bold rounded-2xl border border-border hover:bg-secondary/80 transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-[2] py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Payment'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="py-12 flex flex-col items-center text-center animate-in zoom-in duration-500">
                            <div className="h-24 w-24 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-8 shadow-xl shadow-emerald-500/20">
                                <CheckCircle2 className="h-14 w-14" />
                            </div>
                            <h3 className="text-3xl font-black text-foreground mb-4 tracking-tight">Receipt Generated!</h3>
                            <p className="text-muted-foreground text-lg mb-10 max-w-xs">Transaction for <span className="text-foreground font-bold">{selectedPatient?.full_name}</span> has been confirmed.</p>

                            <div className="w-full space-y-3">
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg hover:bg-primary/90 transition-all"
                                >
                                    Back to Dashboard
                                </button>
                                <button className="w-full py-4 bg-secondary text-foreground font-bold rounded-2xl hover:bg-secondary/80 transition-all">
                                    Print Thermal Receipt
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewTransactionModal;
