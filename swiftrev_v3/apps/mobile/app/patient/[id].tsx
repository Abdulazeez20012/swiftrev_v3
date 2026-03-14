import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Phone,
    MapPin,
    Calendar,
    ArrowLeft,
    Clock,
    Receipt,
    Banknote,
    ChevronRight,
    ShieldCheck,
    UserCircle
} from 'lucide-react-native';
import api from '../../src/services/api';
import { offlineStorage } from '../../src/services/OfflineStorage';
import QuickCollectionModal from '../../src/components/QuickCollectionModal';

export default function PatientDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [patient, setPatient] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCollectionOpen, setIsCollectionOpen] = useState(false);

    const fetchData = async () => {
        try {
            // First try cache
            const cachedPatients = await offlineStorage.getAll('patients');
            const found = cachedPatients.find((p: any) => p.id === id);
            if (found) setPatient(found);

            // Fetch from API for latest data and history
            const [patientRes, historyRes] = await Promise.all([
                api.get(`/patients/${id}`),
                api.get(`/transactions?patientId=${id}`)
            ]);

            setPatient(patientRes.data);
            setHistory(historyRes.data);
        } catch (err) {
            console.error('Failed to fetch patient detail', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#67B1A1" />
            </View>
        );
    }

    if (!patient) {
        return (
            <View style={styles.center}>
                <Text>Patient not found.</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={{ color: '#67B1A1', marginTop: 10 }}>Go Back</Text>
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
                <Text style={styles.headerTitle}>Patient Profile</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.profileSection}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarLargeText}>{patient.full_name?.charAt(0)}</Text>
                    </View>
                    <Text style={styles.patientName}>{patient.full_name}</Text>
                    <Text style={styles.patientId}>ID: {patient.id.substring(0, 8).toUpperCase()}</Text>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.primaryAction}
                        onPress={() => setIsCollectionOpen(true)}
                    >
                        <Banknote size={20} color="#fff" />
                        <Text style={styles.primaryActionText}>Collect Payment</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.infoGrid}>
                    <InfoItem
                        icon={<Phone size={18} color="#67B1A1" />}
                        label="Phone Number"
                        value={patient.phone_number || 'N/A'}
                    />
                    <InfoItem
                        icon={<MapPin size={18} color="#67B1A1" />}
                        label="Address"
                        value={patient.address || 'N/A'}
                    />
                    <InfoItem
                        icon={<Clock size={18} color="#67B1A1" />}
                        label="Age / Gender"
                        value={`${patient.age || 'N/A'} yrs • ${patient.gender?.toUpperCase() || 'N/A'}`}
                    />
                    <InfoItem
                        icon={<ShieldCheck size={18} color="#67B1A1" />}
                        label="Insurance"
                        value={patient.insurance_number || 'Cash Patient'}
                    />
                </View>

                <View style={styles.historySection}>
                    <Text style={styles.sectionTitle}>Recent Visits</Text>
                    {history.length > 0 ? history.map((item, idx) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.historyItem}
                            onPress={() => router.push(`/receipt/${item.id}`)}
                        >
                            <View style={styles.historyIcon}>
                                <Receipt size={20} color="#0D2E33" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.historyName}>{item.revenue_items?.name}</Text>
                                <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.historyAmount}>₦{item.amount.toLocaleString()}</Text>
                                <Text style={styles.historyStatus}>{item.status}</Text>
                            </View>
                        </TouchableOpacity>
                    )) : (
                        <Text style={styles.emptyHistory}>No transaction history found for this patient.</Text>
                    )}
                </View>
            </ScrollView>

            <QuickCollectionModal
                visible={isCollectionOpen}
                onClose={() => setIsCollectionOpen(false)}
                preSelectedPatient={patient}
                onSuccess={() => fetchData()}
            />
        </View>
    );
}

const InfoItem = ({ icon, label, value }: any) => (
    <View style={styles.infoItem}>
        <View style={styles.infoIcon}>{icon}</View>
        <View>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#000',
    },
    scroll: {
        paddingBottom: 40,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    avatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarLargeText: {
        fontSize: 40,
        fontWeight: '900',
        color: '#0D2E33',
    },
    patientName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#000',
    },
    patientId: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    actionRow: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    primaryAction: {
        backgroundColor: '#0D2E33',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    primaryActionText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
    infoGrid: {
        paddingHorizontal: 24,
        gap: 20,
        marginBottom: 40,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    infoIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#000',
        marginTop: 2,
    },
    historySection: {
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#000',
        marginBottom: 20,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    historyIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    historyName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#000',
    },
    historyDate: {
        fontSize: 13,
        fontWeight: '600',
        color: '#9CA3AF',
        marginTop: 2,
    },
    historyAmount: {
        fontSize: 15,
        fontWeight: '900',
        color: '#000',
    },
    historyStatus: {
        fontSize: 11,
        fontWeight: '800',
        color: '#67B1A1',
        marginTop: 2,
    },
    emptyHistory: {
        fontSize: 14,
        color: '#9CA3AF',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 10,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
