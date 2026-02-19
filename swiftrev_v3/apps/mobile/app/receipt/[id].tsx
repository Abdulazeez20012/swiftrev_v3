import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Share
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft,
    Download,
    Share2,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Building2,
    User,
    Calendar,
    Receipt as ReceiptIcon,
    Tag
} from 'lucide-react-native';
import api from '../../src/services/api';

export default function ReceiptDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [transaction, setTransaction] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                const res = await api.get(`/transactions/${id}`);
                setTransaction(res.data);
            } catch (err) {
                console.error('Failed to fetch transaction', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTransaction();
    }, [id]);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `SwiftRev Receipt: ${transaction?.revenue_items?.name} - ₦${transaction?.amount.toLocaleString()}. Ref: ${transaction?.id}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color="#000" />
            </View>
        );
    }

    if (!transaction) {
        return (
            <View style={styles.loadingContainer}>
                <AlertCircle size={40} color="#EF4444" />
                <Text style={styles.errorText}>Transaction not found</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backLink}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>Digital Receipt</Text>
                <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                    <Share2 size={24} color="#000" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.successHeader}>
                    <View style={styles.successBadge}>
                        <CheckCircle2 size={40} color="#10B981" />
                    </View>
                    <Text style={styles.statusText}>Payment Confirmed</Text>
                    <Text style={styles.amountText}>₦{transaction.amount.toLocaleString()}</Text>
                    <Text style={styles.dateText}>{new Date(transaction.created_at).toLocaleString()}</Text>
                </View>

                <View style={styles.receiptBody}>
                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <User size={18} color="#666" />
                        </View>
                        <View>
                            <Text style={styles.label}>Patient</Text>
                            <Text style={styles.value}>{transaction.patients?.full_name || 'Walk-in'}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <Tag size={18} color="#666" />
                        </View>
                        <View>
                            <Text style={styles.label}>Service</Text>
                            <Text style={styles.value}>{transaction.revenue_items?.name}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <Building2 size={18} color="#666" />
                        </View>
                        <View>
                            <Text style={styles.label}>Hospital</Text>
                            <Text style={styles.value}>{transaction.hospitals?.name || 'General Hospital'}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <ReceiptIcon size={18} color="#666" />
                        </View>
                        <View>
                            <Text style={styles.label}>Transaction ID</Text>
                            <Text style={styles.value}>{transaction.id.split('-')[0].toUpperCase()}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>₦{transaction.amount.toLocaleString()}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Service Charge</Text>
                        <Text style={styles.summaryValue}>₦0.00</Text>
                    </View>
                    <View style={[styles.summaryRow, { marginTop: 12 }]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>₦{transaction.amount.toLocaleString()}</Text>
                    </View>
                </View>

                <View style={styles.securityNote}>
                    <ShieldCheck size={16} color="#10B981" />
                    <Text style={styles.securityText}>Verified by SwiftRev HERMS</Text>
                </View>

                <TouchableOpacity style={styles.downloadBtn}>
                    <Download size={20} color="#fff" />
                    <Text style={styles.downloadText}>Download PDF</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    backBtn: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        color: '#000',
    },
    shareBtn: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    content: {
        padding: 24,
        paddingBottom: 60,
    },
    successHeader: {
        alignItems: 'center',
        marginBottom: 40,
    },
    successBadge: {
        width: 64,
        height: 64,
        borderRadius: 24,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#10B981',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    amountText: {
        fontSize: 48,
        fontWeight: '900',
        color: '#000',
        letterSpacing: -2,
        marginBottom: 8,
    },
    dateText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    receiptBody: {
        backgroundColor: '#F9FAFB',
        borderRadius: 32,
        padding: 32,
        marginBottom: 32,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    label: {
        fontSize: 10,
        fontWeight: '800',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 2,
    },
    value: {
        fontSize: 15,
        fontWeight: '700',
        color: '#000',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 24,
        borderStyle: 'dashed',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '900',
        color: '#000',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#000',
    },
    securityNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 40,
    },
    securityText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#10B981',
    },
    downloadBtn: {
        backgroundColor: '#000',
        height: 64,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    downloadText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
    },
    errorText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
        marginTop: 16,
        marginBottom: 8,
    },
    backLink: {
        color: '#3B82F6',
        fontWeight: '700',
    }
});
