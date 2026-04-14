import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
    Search,
    ChevronRight,
    Receipt,
    Clock,
    WifiOff,
    Filter,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSyncStore } from '../../src/store/useSyncStore';
import { offlineStorage } from '../../src/services/OfflineStorage';
import api from '../../src/services/api';
import { Theme } from '../../src/theme';
import { PremiumHeader, PremiumCard, SegmentedControl } from '../../src/components/PremiumUI';

export default function TreatmentHistory() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { status, init, syncNow } = useSyncStore();
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        init();
    }, []);

    useFocusEffect(
        useCallback(() => {
            // Trigger sync when online so new transactions appear immediately
            if (status === 'online') {
                syncNow().catch(() => {});
            }
            fetchHistory();
        }, [status])
    );

    const fetchHistory = async () => {
        try {
            let apiRecords: any[] = [];
            if (status !== 'offline') {
                try {
                    const res = await api.get(`/transactions?hospitalId=${user?.hospitalId}&agentId=${user?.id}&limit=100`);
                    apiRecords = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                    await offlineStorage.updateCache('history', apiRecords);
                } catch (e) {
                    apiRecords = await offlineStorage.getAll('history');
                }
            } else {
                apiRecords = await offlineStorage.getAll('history');
            }

            // Always load pending queue items too
            const queue = await offlineStorage.getSyncQueue();
            const pendingTransactions = queue
                .filter(item => item.type === 'transaction')
                .map(item => ({
                    ...item.data,
                    id: item.id,
                    created_at: new Date(item.timestamp).toISOString(),
                    status: 'pending_sync',
                    isOffline: true,
                    // Map field names for display
                    revenue_items: { name: 'Pending Sync' },
                    patients: { full_name: item.data?.patientName || 'Walk-in' },
                }));

            setPendingCount(pendingTransactions.length);

            const merged = [...pendingTransactions, ...apiRecords].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setRecords(merged);
        } catch (err) {
            console.error('History fetch failed', err);
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
        if (status === 'online') syncNow().catch(() => {});
        fetchHistory();
    };

    const filteredRecords = records.filter(r => {
        const patientName = r.patients?.full_name || '';
        const serviceName = r.revenue_items?.name || '';
        const matchesSearch =
            patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            serviceName.toLowerCase().includes(searchTerm.toLowerCase());

        if (activeTab === 'All') return matchesSearch;
        const isOfflineRecord = r.isOffline || r.status === 'pending_sync';
        return matchesSearch && (activeTab === 'Pending' ? isOfflineRecord : !isOfflineRecord);
    });

    // Grouping logic for Image 6 style
    const groupHistoryByDate = (data: any[]) => {
        const groups: { [key: string]: { total: number, count: number, items: any[] } } = {};
        data.forEach(item => {
            const dateStr = new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
            if (!groups[dateStr]) {
                groups[dateStr] = { total: 0, count: 0, items: [] };
            }
            groups[dateStr].total += item.amount;
            groups[dateStr].count += 1;
            groups[dateStr].items.push(item);
        });
        return groups;
    };

    const groupedData = groupHistoryByDate(filteredRecords);

    return (
        <View style={{ flex: 1, backgroundColor: Theme.colors.background }}>
            <PremiumHeader title="Transaction History" />
            
            <View style={styles.content}>
                <View style={styles.searchBar}>
                    <Search size={20} color={Theme.colors.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search patients or services..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                    <TouchableOpacity style={styles.filterBtn}>
                        <Filter size={20} color={Theme.colors.primary} />
                    </TouchableOpacity>
                </View>

                <SegmentedControl 
                    options={['All', 'Synced', 'Pending']} 
                    selected={activeTab} 
                    onSelect={setActiveTab} 
                />
                {pendingCount > 0 && (
                    <View style={styles.pendingBanner}>
                        <Clock size={14} color={Theme.colors.accent} />
                        <Text style={styles.pendingText}>{pendingCount} transaction(s) waiting to sync to server</Text>
                    </View>
                )}

                <ScrollView
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    {loading ? (
                        <ActivityIndicator color={Theme.colors.primary} style={{ marginTop: 40 }} />
                    ) : Object.keys(groupedData).length > 0 ? (
                        Object.keys(groupedData).map((date) => (
                            <View key={date} style={styles.dateGroup}>
                                <TouchableOpacity style={styles.groupHeader}>
                                    <View style={styles.groupInfo}>
                                        <Text style={styles.groupDate}>{date}</Text>
                                        <Text style={styles.groupCount}>TOTAL ({groupedData[date].count})</Text>
                                    </View>
                                    <View style={styles.groupRight}>
                                        <Text style={styles.groupTotal}>₦{groupedData[date].total.toLocaleString()}</Text>
                                        <ChevronRight size={20} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                                
                                {groupedData[date].items.map((item) => (
                                    <PremiumCard key={item.id} style={styles.historyItem} onPress={() => !item.isOffline && router.push(`/receipt/${item.id}`)}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.itemId} numberOfLines={1}>
                                                {item.revenue_items?.name || 'Service'}
                                            </Text>
                                            <Text style={styles.itemMeta}>
                                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.patients?.full_name || 'Walk-in'}
                                            </Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                            <Text style={styles.itemAmount}>₦{Number(item.amount || 0).toLocaleString()}</Text>
                                            {item.isOffline && (
                                                <View style={styles.pendingPill}>
                                                    <Text style={styles.pendingPillText}>PENDING</Text>
                                                </View>
                                            )}
                                        </View>
                                    </PremiumCard>
                                ))}
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyBox}>
                            <WifiOff size={48} color={Theme.colors.border} />
                            <Text style={styles.emptyText}>No transactions found.</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        paddingHorizontal: Theme.spacing.md,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radius.lg,
        paddingHorizontal: Theme.spacing.md,
        height: 54,
        marginTop: Theme.spacing.md,
        ...Theme.shadows.sm,
    },
    searchInput: {
        flex: 1,
        marginLeft: Theme.spacing.sm,
        ...Theme.typography.body,
        fontSize: 14,
    },
    filterBtn: {
        padding: 8,
    },
    dateGroup: {
        marginBottom: Theme.spacing.lg,
    },
    groupHeader: {
        backgroundColor: Theme.colors.primaryLight,
        padding: Theme.spacing.md,
        borderRadius: Theme.radius.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Theme.spacing.sm,
    },
    groupInfo: {
        flex: 1,
    },
    groupDate: {
        ...Theme.typography.h3,
        color: '#fff',
        fontSize: 16,
    },
    groupCount: {
        ...Theme.typography.caption,
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        marginTop: 2,
    },
    groupRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.sm,
    },
    groupTotal: {
        ...Theme.typography.h3,
        color: '#fff',
        fontSize: 18,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        padding: Theme.spacing.md,
    },
    itemId: {
        ...Theme.typography.label,
        fontSize: 14,
    },
    itemMeta: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
        textTransform: 'none',
        marginTop: 2,
    },
    itemAmount: {
        ...Theme.typography.h3,
        fontSize: 16,
    },
    emptyBox: {
        padding: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        ...Theme.typography.body,
        color: Theme.colors.textMuted,
        marginTop: Theme.spacing.md,
    },
    pendingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        padding: 8,
        borderRadius: 12,
        gap: 6,
        marginBottom: 8,
    },
    pendingText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#92400E',
        flex: 1,
    },
    pendingPill: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    pendingPillText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#92400E',
    },
});
