import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
    Plus,
    Search,
    Tag,
    Layers,
    AlertCircle,
    MoreVertical,
    Zap,
    WifiOff
} from 'lucide-react';
import AddRevenueItemModal from '../components/AddRevenueItemModal';
import NewTransactionModal from '../components/NewTransactionModal';
import { syncManager } from '../services/SyncManager';
import { offlineStorage } from '../services/OfflineStorage';

const RevenueItems = () => {
    const { user } = useAuth();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const fetchItems = async () => {
        if (!user?.hospitalId) return;
        setLoading(true);

        if (syncManager.isOnline()) {
            try {
                const response = await api.get(`/revenue-items?hospitalId=${user.hospitalId}`);
                setItems(response.data);
                await offlineStorage.updateCache('revenue_items', response.data);
            } catch (error) {
                console.error('Failed to fetch revenue items, falling back to cache', error);
                const cached = await offlineStorage.getAll('revenue_items');
                setItems(cached);
            } finally {
                setLoading(false);
            }
        } else {
            const cached = await offlineStorage.getAll('revenue_items');
            setItems(cached);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [user]);

    const handleQuickSelect = (item: any) => {
        setSelectedItem(item);
        setIsTxModalOpen(true);
    };

    const filteredItems = items.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.departments?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Services & Items</h1>
                    <p className="text-muted-foreground mt-1 text-lg">Manage billing items and service pricing for your hospital.</p>
                </div>
                <div className="flex items-center gap-3">
                    {!syncManager.isOnline() && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                            <WifiOff className="h-4 w-4 text-orange-500" />
                            <span className="text-xs font-bold text-orange-500 uppercase">Offline</span>
                        </div>
                    )}
                    {(user?.role === 'super_admin' || user?.role === 'hospital_admin') && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                        >
                            <Plus className="h-4 w-4" />
                            Add New Item
                        </button>
                    )}
                </div>
            </div>

            <div className="relative group max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Search services or departments..."
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.length ? filteredItems.map((item) => (
                    <div key={item.id} className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:border-primary/50 transition-all hover:shadow-md group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 hover:bg-secondary rounded-lg">
                                <MoreVertical className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm shadow-primary/5 group-hover:scale-110 transition-transform">
                                <Tag className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg truncate pr-6 group-hover:text-primary transition-colors">{item.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Layers className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.departments?.name || 'General'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Price</p>
                                <p className="text-xl font-black text-foreground">₦{item.amount.toLocaleString()}</p>
                            </div>
                            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                <span className="text-[10px] font-black text-emerald-600 uppercase">Active</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleQuickSelect(item)}
                            className="w-full mt-6 py-2 bg-secondary text-foreground text-xs font-bold rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all flex items-center justify-center gap-2"
                        >
                            <Zap className="h-3 w-3" />
                            Quick Select
                        </button>
                    </div>
                )) : (
                    <div className="col-span-full py-20 text-center flex flex-col items-center">
                        <div className="p-4 bg-secondary rounded-full mb-4">
                            <AlertCircle className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">No items found</h3>
                        <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Try adjusting your search or add a new revenue item to get started.</p>
                    </div>
                )}
            </div>

            <AddRevenueItemModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => fetchItems()}
            />

            <NewTransactionModal
                isOpen={isTxModalOpen}
                onClose={() => setIsTxModalOpen(false)}
                onSuccess={() => { }} // Dashboard will refresh on next visit
                initialItem={selectedItem}
            />
        </div>
    );
};

export default RevenueItems;
