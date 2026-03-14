import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import {
    Search,
    Filter as FilterIcon,
    Calendar,
    ChevronRight,
    Receipt,
    Clock,
    CheckCircle2,
    AlertCircle,
    WifiOff,
    X,
    Banknote,
    CreditCard
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSyncStore } from '../../src/store/useSyncStore';
import { offlineStorage } from '../../src/services/OfflineStorage';
import api from '../../src/services/api';
import { Modal } from 'react-native';

export default function TreatmentHistory() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { status, init } = useSyncStore();
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter States
    const [showFilters, setShowFilters] = useState(false);
    const [filterMethod, setFilterMethod] = useState<'all' | 'cash' | 'pos'>('all');
    const [filterRange, setFilterRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

    useEffect(() => {
        init();
    }, []);

    const fetchHistory = async () => {
        try {
            let apiRecords = [];
            if (status !== 'offline') {
                try {
                    const res = await api.get(`/transactions?hospitalId=${user?.hospitalId}&agentId=${user?.id}`);
                    apiRecords = res.data;
                    await offlineStorage.updateCache('history', res.data);
                } catch (e) {
                    console.error('API history fetch failed', e);
                    apiRecords = await offlineStorage.getAll('history');
                }
            } else {
                apiRecords = await offlineStorage.getAll('history');
            }

            const queue = await offlineStorage.getSyncQueue();
            const pendingTransactions = queue
                .filter(item => item.type === 'transaction')
                .map(item => ({
                    ...item.data,
                    id: item.id,
                    created_at: new Date(item.timestamp).toISOString(),
                    status: 'pending_sync',
                    isOffline: true
                }));

            const merged = [...pendingTransactions, ...apiRecords].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setRecords(merged);
        } catch (err) {
            console.error('History composite fetch failed', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [status]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const filteredRecords = records.filter(r => {
        // Search filter
        const matchesSearch =
            r.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.revenue_items?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        // Method filter
        const matchesMethod = filterMethod === 'all' || r.payment_method?.toLowerCase() === filterMethod;

        // Date filter
        const recordDate = new Date(r.created_at);
        const now = new Date();
        let matchesDate = true;
        if (filterRange === 'today') {
            matchesDate = recordDate.toDateString() === now.toDateString();
        } else if (filterRange === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            matchesDate = recordDate >= weekAgo;
        } else if (filterRange === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(now.getMonth() - 1);
            matchesDate = recordDate >= monthAgo;
        }

        return matchesSearch && matchesMethod && matchesDate;
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Search size={20} color="#9CA3AF" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search patients or services..."
                            placeholderTextColor="#9CA3AF"
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.filterButton, (filterMethod !== 'all' || filterRange !== 'all') && { backgroundColor: '#0D2E33' }]}
                        onPress={() => setShowFilters(true)}
                    >
                        <FilterIcon size={20} color={(filterMethod !== 'all' || filterRange !== 'all') ? "#fff" : "#0D2E33"} />
                    </TouchableOpacity>
                </View>
            </View>

            <Modal visible={showFilters} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.filterModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter Transactions</Text>
                            <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.closeBtn}>
                                <X size={20} color="#000" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.filterLabel}>PAYMENT METHOD</Text>
                        <View style={styles.filterOptions}>
                            {['all', 'cash', 'pos'].map(m => (
                                <TouchableOpacity
                                    key={m}
                                    style={[styles.option, filterMethod === m && styles.optionActive]}
                                    onPress={() => setFilterMethod(m as any)}
                                >
                                    <Text style={[styles.optionText, filterMethod === m && styles.optionTextActive]}>
                                        {m.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.filterLabel}>DATE RANGE</Text>
                        <View style={[styles.filterOptions, { flexWrap: 'wrap' }]}>
                            {['all', 'today', 'week', 'month'].map(r => (
                                <TouchableOpacity
                                    key={r}
                                    style={[styles.option, filterRange === r && styles.optionActive]}
                                    onPress={() => setFilterRange(r as any)}
                                >
                                    <Text style={[styles.optionText, filterRange === r && styles.optionTextActive]}>
                                        {r.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.applyBtn}
                            onPress={() => setShowFilters(false)}
                        >
                            <Text style={styles.applyBtnText}>Apply Filters</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ScrollView
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />}
            >
                <Text style={styles.sectionTitle}>Transaction Stream</Text>
                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator color="#67B1A1" />
                    </View>
                ) : filteredRecords.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.recordCard, item.isOffline && styles.recordCardOffline]}
                        onPress={() => !item.isOffline && router.push(`/receipt/${item.id}`)}
                        disabled={item.isOffline}
                    >
                        <View style={[styles.iconBox, item.isOffline && styles.iconBoxOffline]}>
                            {item.isOffline ? <WifiOff size={22} color="#F59E0B" /> : <Receipt size={22} color="#0D2E33" />}
                        </View>
                        <View style={styles.recordContent}>
                            <View style={styles.recordRow}>
                                <Text style={styles.patientName}>
                                    {item.patients?.full_name || item.fullName || 'Walk-in Patient'}
                                </Text>
                                <Text style={styles.recordCost}>₦{item.amount.toLocaleString()}</Text>
                            </View>
                            <Text style={styles.serviceName}>{item.revenue_items?.name || item.serviceName || 'Standard Service'}</Text>
                            <View style={styles.recordFooter}>
                                <View style={styles.dateBox}>
                                    <Clock size={12} color="#9CA3AF" />
                                    <Text style={styles.recordDate}>
                                        {item.isOffline ? 'Pending Sync' : new Date(item.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                <StatusBadge status={item.status} />
                            </View>
                        </View>
                        <ChevronRight size={18} color={item.isOffline ? "#F3F4F6" : "#E5E7EB"} />
                    </TouchableOpacity>
                ))}

                {!loading && filteredRecords.length === 0 && (
                    <View style={styles.emptyBox}>
                        <AlertCircle size={40} color="#E5E7EB" />
                        <Text style={styles.emptyText}>No transactions found.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const StatusBadge = ({ status }: { status: string }) => {
    const isComplete = status?.toLowerCase() === 'completed' || status?.toLowerCase() === 'paid';
    return (
        <View style={[styles.badge, isComplete ? styles.badgePaid : styles.badgePending]}>
            <Text style={[styles.badgeText, isComplete ? styles.badgeTextPaid : styles.badgeTextPending]}>
                {status?.toUpperCase() || 'PENDING'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 24,
        backgroundColor: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 54,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    filterButton: {
        width: 54,
        height: 54,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    list: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 20,
    },
    recordCard: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    recordCardOffline: {
        backgroundColor: '#FFFBEB',
        borderBottomColor: '#FEF3C7',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    iconBoxOffline: {
        backgroundColor: '#FEF3C7',
    },
    recordContent: {
        flex: 1,
        marginRight: 12,
    },
    recordRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    patientName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -0.3,
    },
    recordCost: {
        fontSize: 15,
        fontWeight: '900',
        color: '#000',
    },
    serviceName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        marginBottom: 10,
    },
    recordFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    recordDate: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgePaid: {
        backgroundColor: '#F0FDF4',
    },
    badgePending: {
        backgroundColor: '#FEFCE8',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    badgeTextPaid: {
        color: '#67B1A1',
    },
    badgeTextPending: {
        color: '#CA8A04',
    },
    loaderContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyBox: {
        padding: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '700',
        marginTop: 16,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    filterModal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#000',
    },
    closeBtn: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    filterLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#9CA3AF',
        letterSpacing: 1.5,
        marginBottom: 16,
        marginTop: 8,
    },
    filterOptions: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    option: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    optionActive: {
        backgroundColor: '#0D2E33',
        borderColor: '#0D2E33',
    },
    optionText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0D2E33',
    },
    optionTextActive: {
        color: '#fff',
    },
    applyBtn: {
        backgroundColor: '#0D2E33',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    applyBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    }
});
