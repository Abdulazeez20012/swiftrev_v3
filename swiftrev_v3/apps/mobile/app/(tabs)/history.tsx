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
    Filter,
    Calendar,
    ChevronRight,
    Receipt,
    Clock,
    CheckCircle2,
    AlertCircle
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';
import api from '../../src/services/api';

export default function TreatmentHistory() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchHistory = async () => {
        try {
            const res = await api.get(`/transactions?hospitalId=${user?.hospitalId}&agentId=${user?.id}`);
            setRecords(res.data);
        } catch (err) {
            console.error('History fetch failed', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const filteredRecords = records.filter(r =>
        r.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.revenue_items?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <TouchableOpacity style={styles.filterButton}>
                        <Filter size={20} color="#000" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />}
            >
                <Text style={styles.sectionTitle}>Transaction Stream</Text>
                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator color="#000" />
                    </View>
                ) : filteredRecords.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.recordCard}
                        onPress={() => router.push(`/receipt/${item.id}`)}
                    >
                        <View style={styles.iconBox}>
                            <Receipt size={22} color="#000" />
                        </View>
                        <View style={styles.recordContent}>
                            <View style={styles.recordRow}>
                                <Text style={styles.patientName}>{item.patients?.full_name || 'Walk-in Patient'}</Text>
                                <Text style={styles.recordCost}>₦{item.amount.toLocaleString()}</Text>
                            </View>
                            <Text style={styles.serviceName}>{item.revenue_items?.name || 'Standard Service'}</Text>
                            <View style={styles.recordFooter}>
                                <View style={styles.dateBox}>
                                    <Clock size={12} color="#9CA3AF" />
                                    <Text style={styles.recordDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                                </View>
                                <StatusBadge status={item.status} />
                            </View>
                        </View>
                        <ChevronRight size={18} color="#E5E7EB" />
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
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
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
        color: '#10b981',
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
    }
});
