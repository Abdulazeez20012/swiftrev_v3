import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import {
    TrendingUp,
    Banknote,
    CreditCard,
    Wallet,
    Users,
    Clock,
    BarChart2,
    Target,
    ShieldCheck,
    CloudOff,
    Calendar,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSyncStore } from '../../src/store/useSyncStore';
import { offlineStorage } from '../../src/services/OfflineStorage';
import api from '../../src/services/api';

type Period = 'today' | 'yesterday' | 'week' | 'month' | 'year';

const PERIODS: { key: Period; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' },
];

function getPeriodRange(period: Period): { start: Date; end: Date; label: string } {
    const now = new Date();
    switch (period) {
        case 'today':
            return {
                start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
                end: now,
                label: now.toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric' }),
            };
        case 'yesterday': {
            const y = new Date(now);
            y.setDate(y.getDate() - 1);
            return {
                start: new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0),
                end: new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59),
                label: y.toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric' }),
            };
        }
        case 'week': {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            return {
                start: startOfWeek,
                end: now,
                label: `${startOfWeek.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })} — ${now.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}`,
            };
        }
        case 'month': {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return {
                start: startOfMonth,
                end: now,
                label: now.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' }),
            };
        }
        case 'year': {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            return {
                start: startOfYear,
                end: now,
                label: `Year ${now.getFullYear()}`,
            };
        }
    }
}

function filterByPeriod(transactions: any[], period: Period) {
    const { start, end } = getPeriodRange(period);
    return transactions.filter(t => {
        const d = new Date(t.created_at);
        return d >= start && d <= end;
    });
}

export default function EarningsScreen() {
    const { user } = useAuthStore();
    const { status, pendingCount, init } = useSyncStore();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activePeriod, setActivePeriod] = useState<Period>('today');
    const [allStats, setAllStats] = useState<any>(null);
    const [allTxns, setAllTxns] = useState<any[]>([]);

    useEffect(() => { init(); }, []);

    const fetchData = useCallback(async () => {
        try {
            if (status !== 'offline') {
                const [statsRes, txRes] = await Promise.all([
                    api.get(`/dashboard/agent?hospitalId=${user?.hospitalId}&agentId=${user?.id}`),
                    // Fetch up to 1 year of transactions
                    api.get(`/transactions?hospitalId=${user?.hospitalId}&agentId=${user?.id}&limit=500`),
                ]);
                setAllStats(statsRes.data);
                const txData = Array.isArray(txRes.data) ? txRes.data : (txRes.data?.data || []);
                setAllTxns(txData);
                await offlineStorage.updateCache('history', txData);
            } else {
                const queue = await offlineStorage.getSyncQueue();
                const pendingTxns = queue
                    .filter(item => item.type === 'transaction')
                    .map(item => ({ ...item.data, id: item.id, created_at: new Date(item.timestamp).toISOString(), isOffline: true }));
                const cached = await offlineStorage.getAll('history');
                setAllTxns([...pendingTxns, ...cached]);
                setAllStats(null);
            }
        } catch (err) {
            console.error('Earnings fetch error', err);
            const cached = await offlineStorage.getAll('history');
            setAllTxns(cached);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [status, user]);

    useEffect(() => { fetchData(); }, [fetchData]);
    const onRefresh = () => { setRefreshing(true); fetchData(); };

    // Transactions for the selected period
    const periodTxns = filterByPeriod(allTxns, activePeriod);
    const { label: periodLabel } = getPeriodRange(activePeriod);

    // Aggregations for selected period
    const periodTotal = periodTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const cashTotal = periodTxns.filter(t => t.payment_method === 'cash').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const posTotal = periodTxns.filter(t => t.payment_method === 'pos').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const transferTotal = periodTxns.filter(t => t.payment_method === 'transfer').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const nhisTotal = periodTxns.filter(t => t.payment_method === 'nhis').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const patientsCount = new Set(periodTxns.map(t => t.patient_id).filter(Boolean)).size;

    // Compare with previous period (for trend)
    const comparePeriod: Period = activePeriod === 'today' ? 'yesterday'
        : activePeriod === 'week' ? 'week'
        : activePeriod === 'month' ? 'month'
        : 'year';

    // Chart data — group by relevant time unit
    const chartData = buildChartData(periodTxns, activePeriod);
    const maxChart = Math.max(...chartData.map(c => c.amount), 1);

    if (loading) {
        return (
            <View style={s.loadingContainer}>
                <ActivityIndicator color="#67B1A1" size="large" />
                <Text style={s.loadingText}>Loading earnings...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={s.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D2E33" />}
        >
            {/* Header */}
            <View style={s.header}>
                <Text style={s.dateLabel}>{periodLabel}</Text>
                <Text style={s.title}>My Earnings</Text>
            </View>

            {/* Offline banner */}
            {status === 'offline' && (
                <View style={s.offlineBanner}>
                    <CloudOff size={14} color="#F59E0B" />
                    <Text style={s.offlineBannerText}>Offline — Showing cached & pending data</Text>
                    {pendingCount > 0 && (
                        <View style={s.pendingBadge}>
                            <Text style={s.pendingBadgeText}>{pendingCount}</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Period selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.periodRow}>
                {PERIODS.map(p => (
                    <TouchableOpacity
                        key={p.key}
                        onPress={() => setActivePeriod(p.key)}
                        style={[s.periodBtn, activePeriod === p.key && s.periodBtnActive]}
                    >
                        <Text style={[s.periodBtnText, activePeriod === p.key && s.periodBtnTextActive]}>
                            {p.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Hero amount card */}
            <View style={s.heroCard}>
                <View style={s.heroTop}>
                    <View style={s.heroIcon}>
                        <TrendingUp size={20} color="#67B1A1" />
                    </View>
                    <Text style={s.heroLabel}>TOTAL COLLECTED</Text>
                </View>
                <Text style={s.heroAmount}>₦{periodTotal.toLocaleString()}</Text>
                <View style={s.heroMeta}>
                    <View style={s.metaChip}>
                        <Users size={11} color="rgba(255,255,255,0.5)" />
                        <Text style={s.metaText}>{patientsCount} patients</Text>
                    </View>
                    <View style={s.metaChip}>
                        <Clock size={11} color="rgba(255,255,255,0.5)" />
                        <Text style={s.metaText}>{periodTxns.length} transactions</Text>
                    </View>
                </View>
                {allStats?.performance !== undefined && activePeriod === 'today' && (
                    <View style={s.perfRow}>
                        <View style={s.progressBar}>
                            <View style={[s.progressFill, { width: `${Math.min(allStats.performance, 100)}%` }]} />
                        </View>
                        <Text style={s.perfLabel}>{allStats.performance}% of daily target</Text>
                    </View>
                )}
            </View>

            {/* Breakdown by method */}
            <Text style={s.sectionTitle}>Breakdown by Method</Text>
            <View style={s.grid2}>
                <BreakdownCard icon={<Banknote size={18} color="#10B981" />} label="Cash" amount={cashTotal} color="#10B981" bg="#F0FDF4" />
                <BreakdownCard icon={<CreditCard size={18} color="#6366F1" />} label="POS" amount={posTotal} color="#6366F1" bg="#EEF2FF" />
                <BreakdownCard icon={<Wallet size={18} color="#F59E0B" />} label="Transfer" amount={transferTotal} color="#F59E0B" bg="#FFFBEB" />
                <BreakdownCard icon={<ShieldCheck size={18} color="#3B82F6" />} label="NHIS" amount={nhisTotal} color="#3B82F6" bg="#EFF6FF" />
            </View>

            {/* Activity Chart */}
            <Text style={s.sectionTitle}>Activity Timeline</Text>
            <View style={s.chartCard}>
                {periodTxns.length === 0 ? (
                    <View style={s.emptyChart}>
                        <BarChart2 size={28} color="#E5E7EB" />
                        <Text style={s.emptyChartText}>No activity in this period</Text>
                    </View>
                ) : (
                    <View style={s.barChart}>
                        {chartData.map((c, i) => (
                            <View key={i} style={s.barGroup}>
                                <View style={s.barWrapper}>
                                    <View style={[s.bar, { height: Math.max(4, (c.amount / maxChart) * 72) }, c.amount > 0 && { backgroundColor: '#67B1A1' }]} />
                                </View>
                                <Text style={s.barLabel}>{c.label}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* Transaction list for the period */}
            <View style={s.listHeader}>
                <Text style={s.sectionTitle}>Transactions</Text>
                <Text style={s.txCount}>{periodTxns.length} total</Text>
            </View>
            <View style={s.txList}>
                {periodTxns.slice(0, 20).map((t, idx) => (
                    <View key={t.id || idx} style={[s.txItem, idx === Math.min(periodTxns.length, 20) - 1 && { borderBottomWidth: 0 }]}>
                        <View style={[s.txIcon, t.payment_method === 'pos' && { backgroundColor: '#EEF2FF' }, t.payment_method === 'transfer' && { backgroundColor: '#FFFBEB' }, t.payment_method === 'cash' && { backgroundColor: '#F0FDF4' }]}>
                            {t.payment_method === 'pos' ? <CreditCard size={14} color="#6366F1" /> : t.payment_method === 'transfer' ? <Wallet size={14} color="#F59E0B" /> : <Banknote size={14} color="#10B981" />}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.txPatient}>{t.patients?.full_name || 'Patient'}</Text>
                            <Text style={s.txService}>{t.revenue_items?.name || 'Service'}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={s.txAmount}>₦{Number(t.amount).toLocaleString()}</Text>
                            <Text style={s.txTime}>{formatTxTime(t.created_at, activePeriod)}</Text>
                        </View>
                    </View>
                ))}
                {periodTxns.length === 0 && (
                    <Text style={s.emptyTx}>No transactions in this period.</Text>
                )}
                {periodTxns.length > 20 && (
                    <Text style={s.moreText}>+{periodTxns.length - 20} more transactions</Text>
                )}
            </View>

            {/* All-time summary from API */}
            {allStats && (
                <>
                    <Text style={s.sectionTitle}>All-Time Summary</Text>
                    <View style={s.grid2}>
                        <AllTimeCard icon={<Target size={18} color="#6366F1" />} label="Total Revenue" value={`₦${(allStats.revenueTotal || 0).toLocaleString()}`} />
                        <AllTimeCard icon={<Users size={18} color="#0D2E33" />} label="Patients Served" value={(allStats.patientsCount || 0).toString()} />
                    </View>
                </>
            )}

            <View style={{ height: 80 }} />
        </ScrollView>
    );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildChartData(txns: any[], period: Period) {
    if (period === 'today' || period === 'yesterday') {
        // Hourly (6am–9pm)
        return Array.from({ length: 16 }, (_, i) => {
            const h = i + 6;
            const amount = txns.reduce((sum, t) => new Date(t.created_at).getHours() === h ? sum + (Number(t.amount) || 0) : sum, 0);
            return { label: h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`, amount };
        });
    }
    if (period === 'week') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days.map((label, i) => ({
            label,
            amount: txns.reduce((sum, t) => new Date(t.created_at).getDay() === i ? sum + (Number(t.amount) || 0) : sum, 0),
        }));
    }
    if (period === 'month') {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        return Array.from({ length: Math.ceil(daysInMonth / 5) }, (_, i) => {
            const start = i * 5 + 1;
            const end = Math.min(start + 4, daysInMonth);
            const amount = txns.reduce((sum, t) => {
                const d = new Date(t.created_at).getDate();
                return d >= start && d <= end ? sum + (Number(t.amount) || 0) : sum;
            }, 0);
            return { label: `${start}-${end}`, amount };
        });
    }
    // Year — monthly
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((label, m) => ({
        label,
        amount: txns.reduce((sum, t) => new Date(t.created_at).getMonth() === m ? sum + (Number(t.amount) || 0) : sum, 0),
    }));
}

function formatTxTime(iso: string, period: Period) {
    const d = new Date(iso);
    if (period === 'today' || period === 'yesterday') {
        return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
}

// ── Sub-components ─────────────────────────────────────────────────────────

const BreakdownCard = ({ icon, label, amount, color, bg }: any) => (
    <View style={[s.breakdownCard, { backgroundColor: bg }]}>
        <View style={[s.breakdownIcon, { backgroundColor: `${color}22` }]}>{icon}</View>
        <Text style={[s.breakdownAmount, { color }]}>₦{amount.toLocaleString()}</Text>
        <Text style={s.breakdownLabel}>{label}</Text>
    </View>
);

const AllTimeCard = ({ icon, label, value }: any) => (
    <View style={s.allTimeCard}>
        {icon}
        <Text style={s.allTimeValue}>{value}</Text>
        <Text style={s.breakdownLabel}>{label}</Text>
    </View>
);

// ── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    loadingText: { marginTop: 12, fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
    header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 4 },
    dateLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 },
    title: { fontSize: 30, fontWeight: '900', color: '#0D2E33', letterSpacing: -1, marginTop: 2, marginBottom: 12 },

    offlineBanner: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB',
        paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 24, borderRadius: 12,
        marginBottom: 12, gap: 8, borderWidth: 1, borderColor: '#FEF3C7',
    },
    offlineBannerText: { fontSize: 11, fontWeight: '700', color: '#92400E', flex: 1 },
    pendingBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
    pendingBadgeText: { fontSize: 10, fontWeight: '900', color: '#fff' },

    // Period selector
    periodRow: { paddingHorizontal: 20, gap: 8, marginBottom: 16 },
    periodBtn: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100,
        backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#F3F4F6',
    },
    periodBtnActive: { backgroundColor: '#0D2E33', borderColor: '#0D2E33' },
    periodBtnText: { fontSize: 13, fontWeight: '800', color: '#6B7280' },
    periodBtnTextActive: { color: '#fff' },

    // Hero
    heroCard: {
        backgroundColor: '#0D2E33', marginHorizontal: 24, borderRadius: 28, padding: 24, marginBottom: 24,
        shadowColor: '#0D2E33', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
    heroIcon: { backgroundColor: 'rgba(103,177,161,0.2)', padding: 8, borderRadius: 12 },
    heroLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, textTransform: 'uppercase' },
    heroAmount: { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: -1.5, marginBottom: 14 },
    heroMeta: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    metaChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 5 },
    metaText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
    perfRow: { gap: 6 },
    progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#67B1A1', borderRadius: 2 },
    perfLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.35)' },

    sectionTitle: { fontSize: 16, fontWeight: '900', color: '#000', marginHorizontal: 24, marginBottom: 12, marginTop: 4 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 12, marginTop: 4 },
    txCount: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },

    // Grid
    grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 24, marginBottom: 20 },
    breakdownCard: { flex: 1, flexBasis: '44%', borderRadius: 20, padding: 16 },
    breakdownIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    breakdownAmount: { fontSize: 17, fontWeight: '900', letterSpacing: -0.5, marginBottom: 2 },
    breakdownLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },

    // Chart
    chartCard: { marginHorizontal: 24, backgroundColor: '#F9FAFB', borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#F3F4F6' },
    emptyChart: { padding: 28, alignItems: 'center', gap: 8 },
    emptyChartText: { fontSize: 12, fontWeight: '700', color: '#D1D5DB' },
    barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 90 },
    barGroup: { flex: 1, alignItems: 'center', gap: 4 },
    barWrapper: { flex: 1, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
    bar: { width: '75%', backgroundColor: '#E5E7EB', borderRadius: 3, minHeight: 4 },
    barLabel: { fontSize: 7, fontWeight: '800', color: '#9CA3AF' },

    // Transaction list
    txList: { marginHorizontal: 24, backgroundColor: '#F9FAFB', borderRadius: 20, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#F3F4F6' },
    txItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12 },
    txIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    txPatient: { fontSize: 13, fontWeight: '700', color: '#000' },
    txService: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginTop: 2 },
    txAmount: { fontSize: 14, fontWeight: '900', color: '#0D2E33' },
    txTime: { fontSize: 10, fontWeight: '600', color: '#9CA3AF', marginTop: 2 },
    emptyTx: { textAlign: 'center', color: '#9CA3AF', fontWeight: '700', padding: 32, fontSize: 13 },
    moreText: { textAlign: 'center', color: '#9CA3AF', fontWeight: '700', padding: 12, fontSize: 12 },

    // All-time
    allTimeCard: { flex: 1, flexBasis: '44%', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', gap: 4 },
    allTimeValue: { fontSize: 18, fontWeight: '900', color: '#000', marginTop: 8, marginBottom: 2 },
});
