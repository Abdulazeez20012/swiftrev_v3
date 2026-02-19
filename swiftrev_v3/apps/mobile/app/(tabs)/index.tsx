import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import {
    TrendingUp,
    Users,
    LogOut,
    RefreshCcw,
    CloudOff,
    CheckCircle2,
    Wallet,
    Zap
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSyncStore } from '../../src/store/useSyncStore';
import api from '../../src/services/api';
import QuickCollectionModal from '../../src/components/QuickCollectionModal';

export default function AgentDashboard() {
    const { user, logout } = useAuthStore();
    const { processQueue, queue } = useSyncStore();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isCollectionOpen, setIsCollectionOpen] = useState(false);

    useEffect(() => {
        // Background sync trigger
        const interval = setInterval(() => {
            if (queue.length > 0) processQueue();
        }, 30000);
        return () => clearInterval(interval);
    }, [queue]);

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
                    <View style={[styles.pulse, queue.length > 0 && { backgroundColor: '#F59E0B' }]} />
                    <Text style={styles.syncText}>{queue.length > 0 ? `${queue.length} PENDING SYNC` : 'Online & Synced'}</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <LogOut size={18} color="#666" />
                </TouchableOpacity>
            </View>

            <View style={styles.header}>
                <Text style={styles.greeting}>Good day,</Text>
                <Text style={styles.name}>{user?.email?.split('@')[0] || 'Agent'}</Text>
            </View>

            <View style={styles.statsGrid}>
                <StatCard
                    title="Patients Registered"
                    value={stats?.patientsCount || "0"}
                    icon={<Users size={20} color="#000" />}
                    bg="#F3F4F6"
                />
                <StatCard
                    title="Revenue Collected"
                    value={`₦${(stats?.revenueTotal || 0).toLocaleString()}`}
                    icon={<TrendingUp size={20} color="#000" />}
                    bg="#F3F4F6"
                />
            </View>

            <View style={styles.walletCard}>
                <View style={styles.walletHeader}>
                    <View style={styles.walletIcon}>
                        <Wallet size={24} color="#fff" />
                    </View>
                    <Text style={styles.walletTitle}>Agent Balance</Text>
                </View>
                <Text style={styles.walletBalance}>₦{(stats?.balance || 0).toLocaleString()}</Text>
                <View style={styles.walletFooter}>
                    <Text style={styles.walletGoal}>Daily Goal: 80%</Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '80%' }]} />
                    </View>
                </View>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Syncs</Text>
                <TouchableOpacity>
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
                <Zap size={20} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.actionButtonText}>Quick Collection</Text>
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
        backgroundColor: '#10B981',
        marginRight: 8,
    },
    syncText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: '#4B5563',
    },
    logoutBtn: {
        padding: 8,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    header: {
        marginBottom: 32,
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
        gap: 16,
        marginBottom: 24,
    },
    card: {
        flex: 1,
        padding: 20,
        borderRadius: 24,
    },
    cardHeader: {
        marginBottom: 12,
    },
    cardValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#000',
        letterSpacing: -0.5,
    },
    cardTitle: {
        fontSize: 10,
        fontWeight: '700',
        color: '#666',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    walletCard: {
        backgroundColor: '#000',
        padding: 28,
        borderRadius: 32,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 5,
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
        backgroundColor: '#000',
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
