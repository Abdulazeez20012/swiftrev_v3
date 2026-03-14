import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    Alert
} from 'react-native';
import {
    X,
    Search,
    ChevronRight,
    CreditCard,
    Banknote,
    Wallet,
    CheckCircle2,
    Users,
    Tag
} from 'lucide-react-native';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useSyncStore } from '../store/useSyncStore';
import { offlineStorage } from '../services/OfflineStorage';
import * as Location from 'expo-location';

export default function QuickCollectionModal({ visible, onClose, onSuccess, preSelectedPatient }: any) {
    const { user } = useAuthStore();
    const { status, addToQueue, init } = useSyncStore();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [patients, setPatients] = useState<any[]>([]);
    const [revenueItems, setRevenueItems] = useState<any[]>([]);

    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');

    useEffect(() => {
        init();
    }, []);

    useEffect(() => {
        if (visible) {
            fetchPatients();
            fetchRevenueItems();

            if (preSelectedPatient) {
                setSelectedPatient(preSelectedPatient);
                setStep(2);
            } else {
                setSelectedPatient(null);
                setStep(1);
            }
            setSelectedItem(null);
        }
    }, [visible, preSelectedPatient]);

    const fetchPatients = async () => {
        try {
            if (status === 'online') {
                const res = await api.get(`/patients?hospitalId=${user?.hospitalId}`);
                setPatients(res.data);
                await offlineStorage.updateCache('patients', res.data);
            } else {
                const cached = await offlineStorage.getAll('patients');
                setPatients(cached);
            }
        } catch (err) {
            console.error(err);
            const cached = await offlineStorage.getAll('patients');
            setPatients(cached);
        }
    };

    const fetchRevenueItems = async () => {
        try {
            if (status === 'online') {
                const res = await api.get(`/revenue-items?hospitalId=${user?.hospitalId}`);
                setRevenueItems(res.data);
                await offlineStorage.updateCache('revenue_items', res.data);
            } else {
                const cached = await offlineStorage.getAll('revenue_items');
                setRevenueItems(cached);
            }
        } catch (err) {
            console.error(err);
            const cached = await offlineStorage.getAll('revenue_items');
            setRevenueItems(cached);
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        let locationData = { lat: 0, lng: 0 };

        try {
            const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
            if (locStatus === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                locationData = { lat: loc.coords.latitude, lng: loc.coords.longitude };
            }
        } catch (e) {
            console.error('Location capture failed', e);
        }

        const payload = {
            patientId: selectedPatient.id,
            revenueItemId: selectedItem.id,
            amount: selectedItem.amount,
            paymentMethod,
            hospitalId: user?.hospitalId,
            agentId: user?.id,
            latitude: locationData.lat,
            longitude: locationData.lng
        };
        try {
            if (status === 'online') {
                await api.post('/transactions', payload);
                setStep(4); // Success step
                onSuccess?.();
            } else {
                // Offline
                await addToQueue('transaction', payload);
                setStep(4);
                onSuccess?.();
            }
        } catch (err: any) {
            if (!err.response) {
                // Network error
                await addToQueue('transaction', payload);
                setStep(4);
                onSuccess?.();
            } else {
                Alert.alert('Payment Failed', err.response?.data?.message || 'Transaction could not be completed.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {step === 1 && 'Select Patient'}
                            {step === 2 && 'Select Service'}
                            {step === 3 && 'Confirm Payment'}
                            {step === 4 && 'Payment Complete'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {step === 1 && (
                        <View style={{ flex: 1 }}>
                            <View style={styles.searchBar}>
                                <Search size={18} color="#9CA3AF" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Search patients..."
                                    value={searchTerm}
                                    onChangeText={setSearchTerm}
                                />
                            </View>
                            <FlatList
                                data={patients.filter(p => p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.listItem}
                                        onPress={() => {
                                            setSelectedPatient(item);
                                            setStep(2);
                                            setSearchTerm('');
                                        }}
                                    >
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarText}>{item.full_name?.charAt(0)}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.itemName}>{item.full_name}</Text>
                                            <Text style={styles.itemSub}>{item.phone}</Text>
                                        </View>
                                        <ChevronRight size={18} color="#E5E7EB" />
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    )}

                    {step === 2 && (
                        <View style={{ flex: 1 }}>
                            <FlatList
                                data={revenueItems}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.listItem}
                                        onPress={() => {
                                            setSelectedItem(item);
                                            setStep(3);
                                        }}
                                    >
                                        <View style={styles.iconBox}>
                                            <Tag size={20} color="#67B1A1" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.itemName}>{item.name}</Text>
                                            <Text style={styles.itemPrice}>₦{item.amount.toLocaleString()}</Text>
                                        </View>
                                        <ChevronRight size={18} color="#E5E7EB" />
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    )}

                    {step === 3 && (
                        <View style={styles.confirmation}>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>PAYING FOR</Text>
                                <Text style={styles.summaryValue}>{selectedItem?.name}</Text>
                                <Text style={styles.summaryLabel}>PATIENT</Text>
                                <Text style={styles.summaryValue}>{selectedPatient?.full_name}</Text>
                                <View style={styles.divider} />
                                <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                                <Text style={styles.totalValue}>₦{selectedItem?.amount.toLocaleString()}</Text>
                            </View>

                            <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
                            <View style={styles.paymentMethods}>
                                {['cash', 'pos'].map(m => (
                                    <TouchableOpacity
                                        key={m}
                                        onPress={() => setPaymentMethod(m)}
                                        style={[styles.payMethod, paymentMethod === m && styles.payMethodActive]}
                                    >
                                        {m === 'cash' ? <Banknote size={24} color={paymentMethod === m ? '#fff' : '#000'} /> : <CreditCard size={24} color={paymentMethod === m ? '#fff' : '#000'} />}
                                        <Text style={[styles.payMethodText, paymentMethod === m && { color: '#fff' }]}>{m.toUpperCase()}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.confirmBtn}
                                onPress={handleConfirm}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Confirm & Pay</Text>}
                            </TouchableOpacity>
                        </View>
                    )}

                    {step === 4 && (
                        <View style={styles.success}>
                            <CheckCircle2 size={80} color="#67B1A1" />
                            <Text style={styles.successTitle}>Transaction Success</Text>
                            <Text style={styles.successSub}>Receipt has been generated and saved to history.</Text>
                            <TouchableOpacity style={styles.confirmBtn} onPress={onClose}>
                                <Text style={styles.confirmBtnText}>Back to Dashboard</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '85%',
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: '#000',
    },
    closeBtn: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 54,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 16,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    itemSub: {
        fontSize: 13,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '900',
        color: '#67B1A1',
    },
    confirmation: {
        flex: 1,
    },
    summaryCard: {
        backgroundColor: '#F9FAFB',
        padding: 24,
        borderRadius: 24,
        marginBottom: 24,
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#9CA3AF',
        letterSpacing: 1,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#000',
        marginBottom: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 16,
        borderStyle: 'dashed',
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#000',
        marginBottom: 4,
    },
    totalValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#000',
        letterSpacing: -1,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#9CA3AF',
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    paymentMethods: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    payMethod: {
        flex: 1,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        gap: 8,
    },
    payMethodActive: {
        backgroundColor: '#0D2E33',
        borderColor: '#0D2E33',
    },
    payMethodText: {
        fontSize: 11,
        fontWeight: '900',
    },
    confirmBtn: {
        backgroundColor: '#0D2E33',
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
    },
    confirmBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
    },
    success: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 40,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#000',
        marginTop: 24,
        marginBottom: 8,
    },
    successSub: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 40,
        paddingHorizontal: 40,
    }
});
