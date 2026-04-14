import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Layers, Building2, CheckCircle2, Search, ArrowRight, Home, XCircle } from 'lucide-react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { Theme } from '../../src/theme';
import { PremiumHeader, PremiumCard } from '../../src/components/PremiumUI';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSyncStore } from '../../src/store/useSyncStore';

export default function AddRevenueItemScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuthStore();
    const { addToQueue, fetchDepartments, fetchRevenueItems, status, syncNow } = useSyncStore();

    const [depts, setDepts] = useState<any[]>([]);
    const [revenueItems, setRevenueItems] = useState<any[]>([]);
    const [selectedDept, setSelectedDept] = useState<string>('');
    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Payment Method Selection
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pos' | 'transfer'>('cash');

    // Success / Error state
    const [paymentState, setPaymentState] = useState<'idle' | 'success' | 'error'>('idle');
    const [completedItems, setCompletedItems] = useState<any[]>([]);
    const [completedTotal, setCompletedTotal] = useState(0);
    const [completedName, setCompletedName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const hId = user?.hospitalId || '';
            const [dData, iData] = await Promise.all([
                fetchDepartments(hId),
                fetchRevenueItems(hId)
            ]);
            setDepts(dData);
            setRevenueItems(iData);
        } catch (err) {
            console.error('Fetch failed', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleItem = (item: any) => {
        const index = selectedItems.findIndex(i => i.id === item.id);
        if (index > -1) {
            setSelectedItems(selectedItems.filter(i => i.id !== item.id));
        } else {
            setSelectedItems([...selectedItems, item]);
        }
    };

    const totalAmount = selectedItems.reduce((sum, item) => sum + Number(item.amount), 0);

    const handleComplete = async () => {
        if (selectedItems.length === 0) {
            Alert.alert('Selection Required', 'Please select at least one service.');
            return;
        }

        setSubmitting(true);
        try {
            const tempPatientId = uuidv4();
            const fullName = [params.firstName, params.otherNames].filter(Boolean).join(' ');

            // 1. Queue patient registration
            await addToQueue('patient', {
                hospitalId: user?.hospitalId,
                fullName: fullName,
                phoneNumber: params.phone || 'N/A',
                email: params.email || '',
                patientType: 'regular',
                onboardedBy: user?.id,
                offlineId: tempPatientId,
                id: tempPatientId,
            });

            // 2. Queue each transaction
            for (const item of selectedItems) {
                await addToQueue('transaction', {
                    hospitalId: user?.hospitalId,
                    patientId: tempPatientId,
                    revenueItemId: item.id,
                    amount: Number(item.amount),
                    paymentMethod: paymentMethod, 
                    // offlineId maps to client_transaction_id in DB, but DTO expects offlineId
                    offlineId: uuidv4(),
                    status: 'completed',
                    // Added for immediate display in Dashboard/History while offline
                    patientName: fullName,
                    revenue_items: { name: item.name }
                });
            }

            // 3. Immediately sync to server if online — so history updates right away
            if (status === 'online') {
                try {
                    await syncNow();
                } catch (syncErr) {
                    console.warn('Sync failed, will retry later:', syncErr);
                    // Do NOT fail the payment — data is safely queued
                }
            }

            // Save success details before clearing state
            setCompletedItems([...selectedItems]);
            setCompletedTotal(totalAmount);
            setCompletedName(fullName);
            setPaymentState('success');
        } catch (err: any) {
            console.error('Payment Error:', err);
            setErrorMessage(err?.message || 'An unexpected error occurred. Please try again.');
            setPaymentState('error');
        } finally {
            setSubmitting(false);
        }
    };

    // ---------- SUCCESS SCREEN ----------
    if (paymentState === 'success') {
        return (
            <View style={styles.fullScreen}>
                <View style={styles.successWrapper}>
                    {/* Animated check */}
                    <View style={styles.successIconRing}>
                        <View style={styles.successIconInner}>
                            <CheckCircle2 size={56} color="#fff" />
                        </View>
                    </View>

                    <Text style={styles.successTitle}>Payment Recorded!</Text>
                    <Text style={styles.successSubtitle}>
                        Successfully logged for{'\n'}
                        <Text style={styles.successPatient}>{completedName}</Text>
                    </Text>

                    {/* Total & Method */}
                    <View style={styles.totalBadge}>
                        <Text style={styles.totalBadgeLabel}>TOTAL COLLECTED via {paymentMethod.toUpperCase()}</Text>
                        <Text style={styles.totalBadgeAmount}>₦{completedTotal.toLocaleString()}</Text>
                    </View>

                    {/* Items list */}
                    <View style={styles.successItemsCard}>
                        <Text style={styles.successItemsHeader}>SERVICES PAID FOR</Text>
                        {completedItems.map((item, idx) => (
                            <View key={item.id} style={[styles.successItemRow, idx < completedItems.length - 1 && styles.successItemBorder]}>
                                <View style={styles.successItemDot} />
                                <Text style={styles.successItemName} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.successItemAmt}>₦{Number(item.amount).toLocaleString()}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Actions */}
                    <TouchableOpacity style={styles.newPaymentBtn} onPress={() => router.replace('/payment/payer-info')}>
                        <ArrowRight size={20} color={Theme.colors.primary} />
                        <Text style={styles.newPaymentBtnText}>New Payment</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.dashboardBtn} onPress={() => router.push('/(tabs)')}>
                        <Home size={20} color="#fff" />
                        <Text style={styles.dashboardBtnText}>Back to Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ---------- ERROR SCREEN ----------
    if (paymentState === 'error') {
        return (
            <View style={styles.fullScreen}>
                <View style={styles.successWrapper}>
                    <View style={[styles.successIconRing, { backgroundColor: '#FEE2E2' }]}>
                        <View style={[styles.successIconInner, { backgroundColor: '#EF4444' }]}>
                            <XCircle size={56} color="#fff" />
                        </View>
                    </View>
                    <Text style={[styles.successTitle, { color: '#EF4444' }]}>Payment Failed</Text>
                    <Text style={styles.successSubtitle}>{errorMessage}</Text>
                    <TouchableOpacity style={styles.dashboardBtn} onPress={() => setPaymentState('idle')}>
                        <Text style={styles.dashboardBtnText}>Try Again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.newPaymentBtn} onPress={() => router.push('/(tabs)')}>
                        <Text style={styles.newPaymentBtnText}>Go to Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ---------- MAIN SCREEN ----------
    if (loading) return <View style={styles.center}><ActivityIndicator color={Theme.colors.primary} size="large" /></View>;

    return (
        <View style={{ flex: 1, backgroundColor: Theme.colors.background }}>
            <PremiumHeader title="Add Revenue Item" showBack onBack={() => router.back()} />

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.searchContainer}>
                    <Search size={20} color={Theme.colors.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search service name..."
                        placeholderTextColor={Theme.colors.textMuted}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>

                {selectedItems.length > 0 && (
                    <View style={styles.summaryContainer}>
                        <Text style={styles.sectionTitle}>SELECTED ({selectedItems.length})</Text>
                        <View style={styles.summaryList}>
                            {selectedItems.map(item => (
                                <View key={item.id} style={styles.summaryItem}>
                                    <View style={styles.summaryDot} />
                                    <Text style={styles.summaryItemName} numberOfLines={1}>{item.name}</Text>
                                    <Text style={styles.summaryItemAmt}>₦{Number(item.amount).toLocaleString()}</Text>
                                    <TouchableOpacity onPress={() => toggleItem(item)} style={styles.removePill}>
                                        <Text style={styles.removeText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                        <View style={styles.summaryTotal}>
                            <Text style={styles.summaryTotalLabel}>SUBTOTAL</Text>
                            <Text style={styles.summaryTotalAmt}>₦{totalAmount.toLocaleString()}</Text>
                        </View>
                    </View>
                )}

                <Text style={styles.sectionTitle}>PAYMENT METHOD</Text>
                <View style={[styles.chipGrid, { marginBottom: Theme.spacing.lg }]}>
                    <TouchableOpacity
                        style={[styles.chip, paymentMethod === 'cash' && styles.chipActive]}
                        onPress={() => setPaymentMethod('cash')}
                    >
                        <Text style={[styles.chipText, paymentMethod === 'cash' && styles.chipTextActive]}>CASH</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.chip, paymentMethod === 'pos' && styles.chipActive]}
                        onPress={() => setPaymentMethod('pos')}
                    >
                        <Text style={[styles.chipText, paymentMethod === 'pos' && styles.chipTextActive]}>POS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.chip, paymentMethod === 'transfer' && styles.chipActive]}
                        onPress={() => setPaymentMethod('transfer')}
                    >
                        <Text style={[styles.chipText, paymentMethod === 'transfer' && styles.chipTextActive]}>TRANSFER</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>SELECT DEPARTMENT</Text>
                <View style={styles.chipGrid}>
                    <TouchableOpacity
                        style={[styles.chip, !selectedDept && styles.chipActive]}
                        onPress={() => setSelectedDept('')}
                    >
                        <Layers size={14} color={!selectedDept ? '#fff' : Theme.colors.textMuted} />
                        <Text style={[styles.chipText, !selectedDept && styles.chipTextActive]}>ALL</Text>
                    </TouchableOpacity>
                    {depts.map(d => (
                        <TouchableOpacity
                            key={d.id}
                            style={[styles.chip, selectedDept === d.id && styles.chipActive]}
                            onPress={() => setSelectedDept(d.id)}
                        >
                            <Building2 size={14} color={selectedDept === d.id ? '#fff' : Theme.colors.textMuted} />
                            <Text style={[styles.chipText, selectedDept === d.id && styles.chipTextActive]}>{d.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.sectionTitle, { marginTop: Theme.spacing.lg }]}>CHOOSE SERVICE</Text>
                <View style={styles.itemList}>
                    {revenueItems.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Search size={40} color={Theme.colors.border} />
                            <Text style={styles.emptyText}>No services found. Check your connection.</Text>
                        </View>
                    ) : (() => {
                        const filtered = revenueItems.filter(i =>
                            (!selectedDept || i.department_id === selectedDept) &&
                            i.name.toLowerCase().includes(searchTerm.toLowerCase())
                        );
                        if (filtered.length === 0) {
                            return (
                                <View style={styles.emptyState}>
                                    <Search size={40} color={Theme.colors.border} />
                                    <Text style={styles.emptyText}>No services match this filter.</Text>
                                </View>
                            );
                        }
                        return filtered.map(item => {
                            const isActive = selectedItems.some(i => i.id === item.id);
                            return (
                                <PremiumCard
                                    key={item.id}
                                    style={[styles.itemCard, isActive && styles.itemCardActive]}
                                    onPress={() => toggleItem(item)}
                                >
                                    {isActive && (
                                        <View style={styles.checkMark}>
                                            <CheckCircle2 size={16} color="#fff" />
                                        </View>
                                    )}
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.itemName, isActive && { color: Theme.colors.primary }]}>{item.name}</Text>
                                        <Text style={styles.itemCode}>{item.departments?.name || 'General'}</Text>
                                    </View>
                                    <View style={[styles.amountBadge, isActive && { backgroundColor: Theme.colors.primary }]}>
                                        <Text style={[styles.amountText, isActive && { color: '#fff' }]}>₦{Number(item.amount).toLocaleString()}</Text>
                                    </View>
                                </PremiumCard>
                            );
                        });
                    })()}
                </View>
                <View style={{ height: 110 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.completeBtn,
                        {
                            backgroundColor: selectedItems.length > 0 ? Theme.colors.primary : '#E2E8F0',
                        },
                        submitting && { opacity: 0.7 }
                    ]}
                    onPress={handleComplete}
                    disabled={selectedItems.length === 0 || submitting}
                >
                    {submitting ? (
                        <View style={styles.loadingRow}>
                            <ActivityIndicator color="#fff" />
                            <Text style={[styles.completeBtnText, { color: '#fff' }]}>Processing...</Text>
                        </View>
                    ) : (
                        <>
                            <Text style={[styles.completeBtnText, { color: selectedItems.length > 0 ? '#fff' : '#94A3B8' }]}>
                                {selectedItems.length > 0
                                    ? `COMPLETE PAYMENT  ·  ₦${totalAmount.toLocaleString()}`
                                    : 'SELECT SERVICES ABOVE'}
                            </Text>
                            {selectedItems.length > 0 && <CheckCircle2 size={20} color="#fff" />}
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        backgroundColor: Theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Theme.spacing.lg,
    },
    successWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    successIconRing: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Theme.spacing.lg,
    },
    successIconInner: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: Theme.colors.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successTitle: {
        ...Theme.typography.h1,
        color: Theme.colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    successSubtitle: {
        ...Theme.typography.body,
        color: Theme.colors.textMuted,
        textAlign: 'center',
        marginBottom: Theme.spacing.xl,
    },
    successPatient: {
        color: Theme.colors.primary,
        fontWeight: '800',
    },
    totalBadge: {
        backgroundColor: Theme.colors.primary,
        borderRadius: Theme.radius.xl,
        paddingHorizontal: Theme.spacing.xl,
        paddingVertical: Theme.spacing.md,
        alignItems: 'center',
        marginBottom: Theme.spacing.lg,
        width: '100%',
    },
    totalBadgeLabel: {
        ...Theme.typography.caption,
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
    },
    totalBadgeAmount: {
        fontSize: 36,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -1,
    },
    successItemsCard: {
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radius.lg,
        padding: Theme.spacing.md,
        width: '100%',
        marginBottom: Theme.spacing.lg,
        ...Theme.shadows.sm,
    },
    successItemsHeader: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
        marginBottom: Theme.spacing.sm,
    },
    successItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 8,
    },
    successItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    successItemDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Theme.colors.success,
    },
    successItemName: {
        flex: 1,
        ...Theme.typography.body,
        fontSize: 14,
        color: Theme.colors.text,
    },
    successItemAmt: {
        ...Theme.typography.label,
        fontSize: 14,
        color: Theme.colors.primary,
    },
    newPaymentBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#F0F7FF',
        borderRadius: Theme.radius.xl,
        height: 54,
        width: '100%',
        marginBottom: Theme.spacing.sm,
        borderWidth: 1.5,
        borderColor: Theme.colors.primary,
    },
    newPaymentBtnText: {
        ...Theme.typography.label,
        fontSize: 15,
        color: Theme.colors.primary,
    },
    dashboardBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Theme.colors.primary,
        borderRadius: Theme.radius.xl,
        height: 54,
        width: '100%',
    },
    dashboardBtnText: {
        ...Theme.typography.label,
        fontSize: 15,
        color: '#fff',
    },
    container: {
        padding: Theme.spacing.md,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: Theme.radius.md,
        paddingHorizontal: Theme.spacing.md,
        height: 50,
        marginBottom: Theme.spacing.lg,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: Theme.spacing.sm,
        ...Theme.typography.body,
        fontSize: 14,
        color: Theme.colors.text,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        backgroundColor: Theme.colors.background,
        padding: Theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
        ...Theme.shadows.lg,
    },
    sectionTitle: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
        marginBottom: Theme.spacing.sm,
    },
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.surface,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: Theme.radius.full,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        gap: 6,
    },
    chipActive: {
        backgroundColor: Theme.colors.primary,
        borderColor: Theme.colors.primary,
    },
    chipText: {
        ...Theme.typography.label,
        fontSize: 12,
        color: Theme.colors.textMuted,
    },
    chipTextActive: {
        color: '#fff',
    },
    itemList: {
        gap: Theme.spacing.sm,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.spacing.md,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    itemCardActive: {
        borderColor: Theme.colors.primary,
        backgroundColor: '#EFF6FF',
    },
    checkMark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    itemName: {
        ...Theme.typography.label,
        fontSize: 14,
    },
    itemCode: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
        textTransform: 'none',
        marginTop: 2,
    },
    amountBadge: {
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Theme.radius.sm,
    },
    amountText: {
        ...Theme.typography.label,
        color: Theme.colors.primary,
        fontSize: 13,
    },
    summaryContainer: {
        backgroundColor: '#F0F7FF',
        borderRadius: Theme.radius.lg,
        padding: Theme.spacing.md,
        marginBottom: Theme.spacing.lg,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    summaryList: {
        gap: 6,
        marginBottom: Theme.spacing.sm,
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    summaryDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Theme.colors.primary,
    },
    summaryItemName: {
        flex: 1,
        ...Theme.typography.body,
        fontSize: 13,
        color: Theme.colors.text,
    },
    summaryItemAmt: {
        ...Theme.typography.label,
        fontSize: 13,
        color: Theme.colors.primary,
    },
    removePill: {
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    removeText: {
        color: '#EF4444',
        fontSize: 11,
        fontWeight: '800',
    },
    summaryTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#BFDBFE',
        paddingTop: Theme.spacing.sm,
        marginTop: 4,
    },
    summaryTotalLabel: {
        ...Theme.typography.caption,
        color: Theme.colors.primary,
        fontSize: 10,
    },
    summaryTotalAmt: {
        ...Theme.typography.h3,
        color: Theme.colors.primary,
        fontSize: 18,
    },
    completeBtn: {
        height: 60,
        borderRadius: Theme.radius.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        ...Theme.shadows.md,
    },
    completeBtnText: {
        ...Theme.typography.label,
        fontSize: 15,
        letterSpacing: 0.3,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        ...Theme.typography.body,
        color: Theme.colors.textMuted,
        textAlign: 'center',
    },
});
