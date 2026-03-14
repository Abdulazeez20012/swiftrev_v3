import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Image
} from 'react-native';
import {
    TrendingUp,
    Users,
    LogOut,
    RefreshCcw,
    CloudOff,
    CheckCircle2,
    Wallet,
    Zap,
    Plus,
    Banknote,
    Tag
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSyncStore } from '../../src/store/useSyncStore';
import api from '../../src/services/api';
import { useRouter } from 'expo-router';
import QuickCollectionModal from '../../src/components/QuickCollectionModal';

export default function AgentDashboard() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const { status, pendingCount, init } = useSyncStore();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isCollectionOpen, setIsCollectionOpen] = useState(false);

    useEffect(() => {
        init();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get(`/dashboard/agent?hospitalId=${user?.hospitalId}&agentId=${user?.id}`);
            setStats(res.data);
        } catch (err) {
            console.error('Stats fetch failed', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />}
        >
            <View style={styles.topBar}>
                <View style={styles.syncStatus}>
                    <View style={[
                        styles.pulse,
                        status === 'offline' && { backgroundColor: '#F59E0B' },
                        status === 'syncing' && { backgroundColor: '#67B1A1' }
                    ]} />
                    <Text style={styles.syncText}>
                        {status === 'offline' ? `${pendingCount} PENDING` :
                            status === 'syncing' ? 'SYNCING...' : 'Online & Synced'}
                    </Text>
                </View>
                <Image
                    source={require('../../assets/logo.jpg')}
                    style={styles.headerLogo}
                    resizeMode="contain"
                />
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <LogOut size={18} color="#666" />
                </TouchableOpacity>
            </View>

            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.welcome}>Hi, {user?.email?.split('@')[0] || 'Agent'}</Text>
                    <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                </View>
                <Text style={styles.title}>Dashboard</Text>
            </View>

            <View style={styles.statsGrid}>
                <StatCard
                    title="Patients"
                    value={stats?.patientsCount || "0"}
                    icon={<Users size={20} color="#0D2E33" />}
                    bg="#F0F5F5"
                />
                <StatCard
                    title="Revenue"
                    value={`₦${(stats?.revenueTotal || 0).toLocaleString()}`}
                    icon={<TrendingUp size={20} color="#0D2E33" />}
                    bg="#F0F5F5"
                />
                <TouchableOpacity
                    style={[styles.card, { backgroundColor: '#F0F5F5', justifyContent: 'center', alignItems: 'center' }]}
                    onPress={() => router.push('/catalog')}
                >
                    <Tag size={20} color="#0D2E33" />
                    <Text style={styles.cardTitle}>Catalog</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.walletCard}>
                <View style={styles.walletHeader}>
                    <View style={styles.walletIcon}>
                        <Wallet size={24} color="#67B1A1" />
                    </View>
                    <Text style={styles.walletTitle}>Agent Balance</Text>
                </View>
                <Text style={styles.walletBalance}>₦{(stats?.balance || 0).toLocaleString()}</Text>

                <TouchableOpacity
                    style={styles.walletActionBtn}
                    onPress={() => setIsCollectionOpen(true)}
                >
                    <Plus size={16} color="#67B1A1" />
                    <Text style={styles.walletActionText}>New Cash Collection</Text>
                </TouchableOpacity>

                <View style={styles.walletFooter}>
                    <Text style={styles.walletGoal}>Performance: {stats?.performance || 0}%</Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${stats?.performance || 0}%`, backgroundColor: '#67B1A1' }]} />
                    </View>
                </View>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                    <Text style={styles.seeAll}>See History</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.activityList}>
                {stats?.recentActivity?.length ? stats.recentActivity.map((act: any, idx: number) => (
                    <ActivityItem
                        key={idx}
                        title={act.title}
                        time={act.time}
                        status={act.status}
                        isLast={idx === stats.recentActivity.length - 1}
                    />
                )) : (
                    <View style={styles.emptyActivity}>
                        <Text style={styles.emptyText}>No activity recorded today.</Text>
                    </View>
                )}
            </View>

            <TouchableOpacity
                style={styles.mainActionButton}
                onPress={() => setIsCollectionOpen(true)}
            >
                <Banknote size={20} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.actionButtonText}>Collect Payment / Cash</Text>
            </TouchableOpacity>

            <QuickCollectionModal
                visible={isCollectionOpen}
                onClose={() => setIsCollectionOpen(false)}
                onSuccess={() => fetchStats()}
            />
        </ScrollView>
    );
}

const StatCard = ({ title, value, icon, bg }: { title: string, value: string, icon: React.ReactNode, bg: string }) => (
    <View style={[styles.card, { backgroundColor: bg }]}>
        <View style={styles.cardHeader}>
            {icon}
        </View>
        <Text style={styles.cardValue}>{value}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
    </View>
);

const ActivityItem = ({ title, time, status, isLast }: { title: string, time: string, status: string, isLast: boolean }) => (
    <View style={[styles.activityItem, isLast && { borderBottomWidth: 0 }]}>
        <View style={styles.activityIcon}>
            <CheckCircle2 size={16} color="#10B981" />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.activityTitle}>{title}</Text>
            <Text style={styles.activityTime}>{time}</Text>
        </View>
        <Text style={styles.activityStatus}>{status}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 24,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    syncStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
    },
    pulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#67B1A1',
        marginRight: 8,
    },
    syncText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: '#4B5563',
    },
    headerLogo: {
        height: 32,
        width: 100,
    },
    logoutBtn: {
        padding: 8,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    welcome: {
        fontSize: 16,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    date: {
        fontSize: 14,
        fontWeight: '600',
        color: '#D1D5DB',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0D2E33',
        letterSpacing: -1,
    },
    greeting: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    name: {
        fontSize: 32,
        fontWeight: '900',
        color: '#000',
        letterSpacing: -1,
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 16,
        marginBottom: 24,
    },
    card: {
        flex: 1,
        padding: 20,
        borderRadius: 28,
        minHeight: 140,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0D2E33',
        marginTop: 12,
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    walletCard: {
        marginHorizontal: 24,
        padding: 24,
        borderRadius: 32,
        backgroundColor: '#0D2E33',
        marginBottom: 32,
        shadowColor: '#0D2E33',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    walletHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    walletIcon: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 10,
        borderRadius: 14,
        marginRight: 12,
    },
    walletTitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    walletBalance: {
        color: '#fff',
        fontSize: 36,
        fontWeight: '900',
        letterSpacing: -1,
    },
    walletActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 16,
        gap: 8,
    },
    walletActionText: {
        color: '#67B1A1',
        fontSize: 13,
        fontWeight: '800',
    },
    walletFooter: {
        marginTop: 20,
    },
    walletGoal: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 8,
    },
    progressBar: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#000',
        letterSpacing: -0.5,
    },
    seeAll: {
        fontSize: 12,
        fontWeight: '700',
        color: '#666',
    },
    activityList: {
        marginBottom: 32,
    },
    activityItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        flexDirection: 'row',
        alignItems: 'center',
    },
    activityIcon: {
        width: 32,
        height: 32,
        backgroundColor: '#F0FDF4',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    activityTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000',
    },
    activityTime: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
        marginTop: 2,
    },
    activityStatus: {
        fontSize: 13,
        fontWeight: '900',
        color: '#000',
    },
    emptyActivity: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    emptyText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    mainActionButton: {
        backgroundColor: '#67B1A1',
        height: 64,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 5,
        marginBottom: 40,
    },
    actionButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '900',
    },
});
