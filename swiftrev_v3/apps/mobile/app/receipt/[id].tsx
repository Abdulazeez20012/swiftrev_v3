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
    Tag,
    Printer
} from 'lucide-react-native';
import api from '../../src/services/api';
import { ThermalPrinter } from '../../src/services/ThermalPrinter';

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

    const [printing, setPrinting] = useState(false);

    const handlePrint = async () => {
        if (!transaction) return;
        setPrinting(true);
        try {
            await ThermalPrinter.printReceipt({
                hospitalName: transaction.hospitals?.name || 'SwiftRev Partner',
                hospitalAddress: transaction.hospitals?.address || 'Medical Center',
                patientName: transaction.patients?.full_name || 'Walk-in',
                serviceName: transaction.revenue_items?.name,
                amount: transaction.amount,
                transactionId: transaction.id.split('-')[0].toUpperCase(),
                date: new Date(transaction.created_at).toLocaleString(),
                paymentMethod: transaction.payment_method,
            });
            alert('Printing request sent to device.');
        } catch (err) {
            alert('Printing failed. Please ensure a Bluetooth printer is connected.');
        } finally {
            setPrinting(false);
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
                <View style={styles.receiptWrapper}>
                    {/* Hospital Branding */}
                    <View style={styles.hospitalBranding}>
                        <View style={styles.logoContainer}>
                            {transaction.hospitals?.logo_url ? (
                                <Text>Logo Placeholder</Text> // In real app, use Image
                            ) : (
                                <Building2 size={32} color="#0D2E33" />
                            )}
                        </View>
                        <Text style={styles.hospitalNameDisplay}>{transaction.hospitals?.name || 'General Hospital'}</Text>
                        <Text style={styles.hospitalAddressDisplay}>{transaction.hospitals?.address || 'Medical Center Address'}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.successHeader}>
                        <View style={styles.successBadge}>
                            <CheckCircle2 size={32} color="#10B981" />
                        </View>
                        <Text style={styles.statusText}>Payment Confirmed</Text>
                        <Text style={styles.amountText}>₦{transaction.amount.toLocaleString()}</Text>
                        <Text style={styles.dateText}>{new Date(transaction.created_at).toLocaleString()}</Text>
                    </View>

                    <View style={styles.detailsBox}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Patient</Text>
                            <Text style={styles.detailValue}>{transaction.patients?.full_name || 'Walk-in'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Service</Text>
                            <Text style={styles.detailValue}>{transaction.revenue_items?.name}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Reference</Text>
                            <Text style={styles.detailValue}>#{transaction.id.split('-')[0].toUpperCase()}</Text>
                        </View>
                    </View>

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Paid</Text>
                        <Text style={styles.totalValue}>₦{transaction.amount.toLocaleString()}</Text>
                    </View>

                    <View style={styles.footerBranding}>
                        <View style={styles.swiftRevLine}>
                            <Text style={styles.poweredBy}>Powered by</Text>
                            <Text style={styles.swiftRevBrand}>SwiftRev HERMS</Text>
                            <ShieldCheck size={14} color="#67B1A1" />
                        </View>
                        <Text style={styles.verificationNote}>Verified Digital Document</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.downloadBtn}>
                    <Download size={20} color="#fff" />
                    <Text style={styles.downloadText}>Download PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.downloadBtn, { backgroundColor: '#F3F4F6', marginTop: 12 }]} 
                    onPress={handlePrint}
                    disabled={printing}
                >
                    <Printer size={20} color="#000" />
                    <Text style={[styles.downloadText, { color: '#000' }]}>
                        {printing ? 'Connecting...' : 'Print to Thermal'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
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
        paddingBottom: 16,
        backgroundColor: '#fff',
    },
    backBtn: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000',
        letterSpacing: 0.5,
    },
    shareBtn: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    content: {
        padding: 20,
    },
    receiptWrapper: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 24,
    },
    hospitalBranding: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    hospitalNameDisplay: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0D2E33',
        textAlign: 'center',
    },
    hospitalAddressDisplay: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 24,
    },
    successHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    successBadge: {
        marginBottom: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#10B981',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    amountText: {
        fontSize: 36,
        fontWeight: '900',
        color: '#000',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    detailsBox: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0D2E33',
        padding: 20,
        borderRadius: 16,
        marginBottom: 32,
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#fff',
        textTransform: 'uppercase',
        opacity: 0.8,
    },
    totalValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
    },
    footerBranding: {
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 24,
    },
    swiftRevLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    poweredBy: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    swiftRevBrand: {
        fontSize: 11,
        fontWeight: '900',
        color: '#0D2E33',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    verificationNote: {
        fontSize: 9,
        color: '#9CA3AF',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    downloadBtn: {
        backgroundColor: '#000',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    downloadText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
        marginTop: 16,
        marginBottom: 8,
    },
    backLink: {
        color: '#67B1A1',
        fontWeight: '800',
    }
});
