import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
    CreditCard,
    History,
    Settings,
    LogOut,
    RefreshCcw,
    Wallet,
    TrendingUp,
    Zap,
    Plus,
    Banknote,
    Clock,
    CheckCircle2,
    Building2,
    Layers,
    ChevronRight,
    ArrowUpRight
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSyncStore } from '../../src/store/useSyncStore';
import { offlineStorage } from '../../src/services/OfflineStorage';
import api from '../../src/services/api';
import { useRouter } from 'expo-router';
import { Theme } from '../../src/theme';
import { PremiumHeader, PremiumCard, SegmentedControl } from '../../src/components/PremiumUI';


export default function AgentDashboard() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const { status, pendingCount, init } = useSyncStore();
    const [stats, setStats] = useState<any>(null);
    const [offlineActivity, setOfflineActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [recentTab, setRecentTab] = useState('Online');


    useEffect(() => {
        init();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchStats();
        }, [])
    );

    const fetchStats = async () => {
        try {
            const hospitalId = user?.hospitalId || '';
            
            // 1. Fetch Online Stats
            const res = await api.get(`/dashboard/agent?hospitalId=${hospitalId}&agentId=${user?.id}`);
            setStats(res.data);

            // 2. Fetch Offline Queue
            const queue = await offlineStorage.getSyncQueue();
            const pending = queue
                .filter(item => item.type === 'transaction')
                .map(item => ({
                    title: `${item.data?.revenue_items?.name || 'Service'} - ${item.data?.patientName || 'Walk-in'}`,
                    time: 'Pending Sync',
                    status: 'PENDING',
                }));
            setOfflineActivity(pending);

        } catch (err: any) {
            console.error('Stats fetch failed', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const MenuGrid = () => (
        <View style={styles.menuGrid}>
            <MenuCard title="NEW PAYMENT" icon={<CreditCard color="#fff" size={28} />} color={Theme.colors.primary} onPress={() => router.push('/payment/payer-info')} />

            <MenuCard title="HISTORY" icon={<History color="#fff" size={28} />} color="#F59E0B" onPress={() => router.push('/(tabs)/history')} />
            <MenuCard title="SETTING" icon={<Settings color="#fff" size={28} />} color="#10B981" onPress={() => router.push('/(tabs)/profile')} />
            <MenuCard title="LOGOUT" icon={<LogOut color="#fff" size={28} />} color="#EF4444" onPress={logout} />
        </View>
    );

    const MenuCard = ({ title, icon, color, onPress }: any) => (
        <TouchableOpacity style={styles.menuCard} onPress={onPress}>
            <View style={[styles.iconWrapper, { backgroundColor: color }]}>
                {icon}
            </View>
            <Text style={styles.menuTitle}>{title}</Text>
        </TouchableOpacity>
    );

    const StatGrid = () => (
        <View style={styles.statGrid}>
            <StatCard label="CASH HELD" value={`₦${(stats?.cashHeld || 0).toLocaleString()}`} icon={<Banknote size={16} color={Theme.colors.primary} />} />
            <StatCard label="POS EARNINGS" value={`₦${(stats?.posTotal || 0).toLocaleString()}`} icon={<CreditCard size={16} color={Theme.colors.primary} />} />
            <StatCard label="TRANSFERS" value={`₦${(stats?.transferTotal || 0).toLocaleString()}`} icon={<ArrowUpRight size={16} color={Theme.colors.primary} />} />
            <StatCard label="TOTAL REVENUE" value={`₦${(stats?.revenueTotal || 0).toLocaleString()}`} icon={<TrendingUp size={16} color={Theme.colors.primary} />} />
        </View>
    );

    const StatCard = ({ label, value, icon }: any) => (
        <PremiumCard style={styles.statCard}>
            <Text style={styles.statLabel}>{label}</Text>
            <View style={styles.statRow}>
                {icon}
                <Text style={styles.statValue}>{value}</Text>
            </View>
        </PremiumCard>
    );

    return (
        <View style={{ flex: 1, backgroundColor: Theme.colors.background }}>
            <PremiumHeader 
                title="MENU" 
                rightElement={
                    <View style={styles.syncIndicator}>
                        <View style={[styles.pulse, { backgroundColor: status === 'offline' ? Theme.colors.accent : Theme.colors.success }]} />
                        <Text style={styles.syncText}>{status.toUpperCase()}</Text>
                    </View>
                }
            />
            
            <ScrollView 
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {status === 'offline' && (
                    <View style={styles.offlineBanner}>
                        <Zap size={16} color="#fff" />
                        <Text style={styles.offlineText}>YOU ARE OFFLINE - TRANSACTIONS WILL BE SAVED LOCALLY</Text>
                    </View>
                )}
                
                <MenuGrid />

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>TRANSACTIONS TODAY</Text>
                    <TouchableOpacity onPress={onRefresh}>
                        <RefreshCcw size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
                
                <StatGrid />

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>RECENT TRANSACTION</Text>
                </View>

                <SegmentedControl 
                    options={['Online', 'Offline']} 
                    selected={recentTab} 
                    onSelect={setRecentTab} 
                />

                <View style={styles.recentList}>
                    {loading ? (
                        <ActivityIndicator color={Theme.colors.primary} style={{ marginTop: 20 }} />
                    ) : (recentTab === 'Online' ? stats?.recentActivity : offlineActivity)?.length > 0 ? (recentTab === 'Online' ? stats.recentActivity : offlineActivity).map((item: any, idx: number) => (
                        <PremiumCard key={idx} style={styles.activityItem}>
                            <View style={[styles.activityDot, { backgroundColor: item.status === 'COMPLETED' ? Theme.colors.success : Theme.colors.accent }]} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.activityId} numberOfLines={1}>{item.title || 'Payment'}</Text>
                                <Text style={styles.activityDate}>{item.time || ''}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: item.status === 'COMPLETED' ? '#D1FAE5' : '#FEF3C7' }]}>
                                <Text style={[styles.statusText, { color: item.status === 'COMPLETED' ? '#065F46' : '#92400E' }]}>{item.status || 'PENDING'}</Text>
                            </View>
                        </PremiumCard>
                    )) : (
                        <View style={styles.emptyState}>
                            <CheckCircle2 size={40} color={Theme.colors.border} />
                            <Text style={styles.emptyText}>
                                {recentTab === 'Online' 
                                    ? "No synced transactions yet.\nTap NEW PAYMENT to get started."
                                    : "No pending transactions.\nEverything has been synced!"}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Theme.spacing.md,
    },
    offlineBanner: {
        backgroundColor: Theme.colors.accent,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        marginHorizontal: -Theme.spacing.md,
        gap: 8,
    },
    offlineText: {
        ...Theme.typography.caption,
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
    },
    syncIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: Theme.radius.full,
    },
    pulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    syncText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Theme.spacing.md,
        marginVertical: Theme.spacing.xl,
    },
    menuCard: {
        width: '47%', // roughly half
        backgroundColor: '#fff',
        borderRadius: Theme.radius.lg,
        padding: Theme.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        ...Theme.shadows.sm,
    },
    iconWrapper: {
        width: 60,
        height: 60,
        borderRadius: Theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Theme.spacing.sm,
    },
    menuTitle: {
        ...Theme.typography.label,
        color: Theme.colors.text,
        fontSize: 12,
    },
    sectionHeader: {
        backgroundColor: Theme.colors.primary,
        padding: Theme.spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: -Theme.spacing.md,
        marginBottom: Theme.spacing.md,
    },
    sectionTitle: {
        ...Theme.typography.h3,
        color: '#fff',
        fontSize: 16,
    },
    statGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Theme.spacing.sm,
        marginBottom: Theme.spacing.xl,
    },
    statCard: {
        width: '48.5%',
        padding: Theme.spacing.md,
    },
    statLabel: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
        fontSize: 10,
        marginBottom: 4,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statValue: {
        ...Theme.typography.label,
        fontSize: 14,
        color: Theme.colors.text,
    },
    recentList: {
        gap: Theme.spacing.sm,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.spacing.md,
        gap: 10,
    },
    activityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    activityId: {
        ...Theme.typography.label,
        fontSize: 13,
        color: Theme.colors.text,
    },
    activityDate: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
        textTransform: 'none',
        marginTop: 2,
        fontSize: 11,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Theme.radius.sm,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        ...Theme.typography.body,
        color: Theme.colors.textMuted,
    },
});

