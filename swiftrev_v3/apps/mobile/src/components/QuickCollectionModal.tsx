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
    Alert,
    ScrollView
} from 'react-native';
import {
    X,
    Search,
    ChevronRight,
    CreditCard,
    Banknote,
    Wallet,
    CheckCircle2,
    Tag,
    Layers,
    ShieldCheck,
    ArrowLeft
} from 'lucide-react-native';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useSyncStore } from '../store/useSyncStore';
import { offlineStorage } from '../services/OfflineStorage';
import * as Location from 'expo-location';

export default function QuickCollectionModal({ visible, onClose, onSuccess, preSelectedPatient }: any) {
    const { user } = useAuthStore();
    const { status, addToQueue, init } = useSyncStore();
    const [step, setStep] = useState(1); // 1=patient, 2=department, 3=service, 4=confirm, 5=success
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [patients, setPatients] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [revenueItems, setRevenueItems] = useState<any[]>([]);

    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [selectedDept, setSelectedDept] = useState<any>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');

    useEffect(() => {
        init();
    }, []);

    useEffect(() => {
        if (visible) {
            fetchAll();
            if (preSelectedPatient) {
                setSelectedPatient(preSelectedPatient);
                setStep(2);
            } else {
                setSelectedPatient(null);
                setStep(1);
            }
            setSelectedDept(null);
            setSelectedItem(null);
            setSearchTerm('');
        }
    }, [visible, preSelectedPatient]);

    const fetchAll = async () => {
        try {
            if (status === 'online') {
                const [pRes, iRes, dRes] = await Promise.all([
                    api.get(`/patients?hospitalId=${user?.hospitalId}`),
                    api.get(`/revenue-items?hospitalId=${user?.hospitalId}`),
                    api.get(`/departments?hospitalId=${user?.hospitalId}`),
                ]);
                setPatients(pRes.data);
                setRevenueItems(iRes.data);
                setDepartments(dRes.data);
                await offlineStorage.updateCache('patients', pRes.data);
                await offlineStorage.updateCache('revenue_items', iRes.data);
            } else {
                const [pCache, iCache] = await Promise.all([
                    offlineStorage.getAll('patients'),
                    offlineStorage.getAll('revenue_items'),
                ]);
                setPatients(pCache);
                setRevenueItems(iCache);
                setDepartments([]);
            }
        } catch (err) {
            const [pCache, iCache] = await Promise.all([
                offlineStorage.getAll('patients'),
                offlineStorage.getAll('revenue_items'),
            ]);
            setPatients(pCache);
            setRevenueItems(iCache);
        }
    };

    // Determine the price to charge based on patient type
    const getEffectiveAmount = (item: any, patient: any): number => {
        const nhisTypes = ['nhis', 'capitation', 'retainer'];
        if (nhisTypes.includes(patient?.patient_type) && item?.nhis_amount) {
            return item.nhis_amount;
        }
        return item?.amount || 0;
    };

    const isNhisPatient = (patient: any) => ['nhis', 'capitation', 'retainer'].includes(patient?.patient_type);

    const filteredServices = revenueItems.filter(item => {
        const matchDept = !selectedDept || item.departments?.name === selectedDept.name || item.department_id === selectedDept.id;
        const matchSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchDept && matchSearch;
    });

    const handleConfirm = async () => {
        setLoading(true);
        let locationData = { lat: 0, lng: 0 };
        try {
            const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
            if (locStatus === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                locationData = { lat: loc.coords.latitude, lng: loc.coords.longitude };
            }
        } catch (e) { console.error('Location error', e); }

        const effectiveAmount = getEffectiveAmount(selectedItem, selectedPatient);
        const payload = {
            patientId: selectedPatient.id,
            revenueItemId: selectedItem.id,
            amount: effectiveAmount,
            paymentMethod,
            hospitalId: user?.hospitalId,
            agentId: user?.id,
            latitude: locationData.lat,
            longitude: locationData.lng
        };

        try {
            if (status === 'online') {
                await api.post('/transactions', payload);
                setStep(5);
                onSuccess?.();
            } else {
                await addToQueue('transaction', payload);
                setStep(5);
                onSuccess?.();
            }
        } catch (err: any) {
            if (!err.response) {
                await addToQueue('transaction', payload);
                setStep(5);
                onSuccess?.();
            } else {
                Alert.alert('Payment Failed', err.response?.data?.message || 'Transaction could not be completed.');
            }
        } finally {
            setLoading(false);
        }
    };

    const stepTitle = ['Select Patient', 'Select Department', 'Select Service', 'Confirm Payment', 'Payment Complete'];

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.header}>
                        {step > 1 && step < 5 && (
                            <TouchableOpacity onPress={() => setStep(s => s - 1)} style={styles.backBtn}>
                                <ArrowLeft size={18} color="#000" />
                            </TouchableOpacity>
                        )}
                        <Text style={styles.title}>{stepTitle[step - 1]}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {/* Step dots */}
                    <View style={styles.dots}>
                        {[1, 2, 3, 4].map(s => (
                            <View key={s} style={[styles.dot, step >= s && styles.dotActive]} />
                        ))}
                    </View>

                    {/* STEP 1: Patient Selection */}
                    {step === 1 && (
                        <View style={{ flex: 1 }}>
                            <View style={styles.searchBar}>
                                <Search size={18} color="#9CA3AF" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Search patients..."
                                    value={searchTerm}
                                    onChangeText={setSearchTerm}
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                            <FlatList
                                data={patients.filter(p => p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.listItem}
                                        onPress={() => { setSelectedPatient(item); setStep(2); setSearchTerm(''); }}
                                    >
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarText}>{item.full_name?.charAt(0)}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.itemName}>{item.full_name}</Text>
                                            <View style={styles.itemSubRow}>
                                                <Text style={styles.itemSub}>{item.phone_number || 'No phone'}</Text>
                                                {isNhisPatient(item) && (
                                                    <View style={styles.nhisBadge}>
                                                        <ShieldCheck size={10} color="#3B82F6" />
                                                        <Text style={styles.nhisBadgeText}>{item.patient_type?.toUpperCase()}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                        <ChevronRight size={18} color="#E5E7EB" />
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={<Text style={styles.empty}>No patients found</Text>}
                            />
                        </View>
                    )}

                    {/* STEP 2: Department Selection */}
                    {step === 2 && (
                        <ScrollView style={{ flex: 1 }}>
                            {/* Selected patient indicator */}
                            <View style={styles.selectedPatientCard}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{selectedPatient?.full_name?.charAt(0)}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.patientCardName}>{selectedPatient?.full_name}</Text>
                                    {isNhisPatient(selectedPatient) && (
                                        <Text style={styles.nhisNote}>⚑ NHIS pricing will be applied</Text>
                                    )}
                                </View>
                            </View>

                            <Text style={styles.sectionLabel}>SELECT DEPARTMENT</Text>
                            <View style={styles.deptGrid}>
                                {departments.map(dept => (
                                    <TouchableOpacity
                                        key={dept.id}
                                        onPress={() => { setSelectedDept(dept); setStep(3); }}
                                        style={styles.deptCard}
                                    >
                                        <Layers size={20} color="#0D2E33" />
                                        <Text style={styles.deptName}>{dept.name}</Text>
                                        <ChevronRight size={16} color="#E5E7EB" style={{ marginLeft: 'auto' }} />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.skipDeptBtn}
                                onPress={() => { setSelectedDept(null); setStep(3); }}
                            >
                                <Text style={styles.skipDeptText}>Skip — Show All Services</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    )}

                    {/* STEP 3: Service Selection */}
                    {step === 3 && (
                        <View style={{ flex: 1 }}>
                            {selectedDept && (
                                <View style={styles.activeDeptBadge}>
                                    <Layers size={12} color="#67B1A1" />
                                    <Text style={styles.activeDeptText}>{selectedDept.name}</Text>
                                    <TouchableOpacity onPress={() => setSelectedDept(null)}>
                                        <X size={14} color="#9CA3AF" />
                                    </TouchableOpacity>
                                </View>
                            )}
                            <View style={styles.searchBar}>
                                <Search size={18} color="#9CA3AF" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Search services..."
                                    value={searchTerm}
                                    onChangeText={setSearchTerm}
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                            <FlatList
                                data={filteredServices}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => {
                                    const price = getEffectiveAmount(item, selectedPatient);
                                    const isNhis = isNhisPatient(selectedPatient) && item.nhis_amount;
                                    return (
                                        <TouchableOpacity
                                            style={styles.listItem}
                                            onPress={() => { setSelectedItem(item); setStep(4); setSearchTerm(''); }}
                                        >
                                            <View style={styles.iconBox}>
                                                <Tag size={20} color="#67B1A1" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.itemName}>{item.name}</Text>
                                                <Text style={styles.itemDept}>{item.departments?.name || 'General'}</Text>
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={[styles.itemPrice, isNhis && styles.nhisPrice]}>
                                                    ₦{price.toLocaleString()}
                                                </Text>
                                                {isNhis && <Text style={styles.nhisLabel}>NHIS</Text>}
                                            </View>
                                            <ChevronRight size={18} color="#E5E7EB" style={{ marginLeft: 8 }} />
                                        </TouchableOpacity>
                                    );
                                }}
                                ListEmptyComponent={<Text style={styles.empty}>No services found</Text>}
                            />
                        </View>
                    )}

                    {/* STEP 4: Confirmation */}
                    {step === 4 && (
                        <View style={styles.confirmation}>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>PATIENT</Text>
                                <Text style={styles.summaryValue}>{selectedPatient?.full_name}</Text>
                                {isNhisPatient(selectedPatient) && (
                                    <View style={styles.nhisBadge}>
                                        <ShieldCheck size={10} color="#3B82F6" />
                                        <Text style={styles.nhisBadgeText}>{selectedPatient.patient_type?.toUpperCase()} Patient</Text>
                                    </View>
                                )}
                                <Text style={[styles.summaryLabel, { marginTop: 12 }]}>SERVICE</Text>
                                <Text style={styles.summaryValue}>{selectedItem?.name}</Text>
                                <Text style={styles.summaryDept}>{selectedItem?.departments?.name || 'General'}</Text>
                                <View style={styles.divider} />
                                <Text style={styles.totalLabel}>AMOUNT DUE</Text>
                                <Text style={styles.totalValue}>
                                    ₦{getEffectiveAmount(selectedItem, selectedPatient).toLocaleString()}
                                </Text>
                                {isNhisPatient(selectedPatient) && selectedItem?.nhis_amount && (
                                    <Text style={styles.nhisDiscount}>
                                        NHIS rate applied (Regular: ₦{selectedItem.amount.toLocaleString()})
                                    </Text>
                                )}
                            </View>

                            <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
                            <View style={styles.paymentMethods}>
                                {[
                                    { key: 'cash', label: 'Cash', icon: <Banknote size={24} color={paymentMethod === 'cash' ? '#fff' : '#000'} /> },
                                    { key: 'pos', label: 'POS', icon: <CreditCard size={24} color={paymentMethod === 'pos' ? '#fff' : '#000'} /> },
                                    { key: 'transfer', label: 'Transfer', icon: <Wallet size={24} color={paymentMethod === 'transfer' ? '#fff' : '#000'} /> },
                                ].map(m => (
                                    <TouchableOpacity
                                        key={m.key}
                                        onPress={() => setPaymentMethod(m.key)}
                                        style={[styles.payMethod, paymentMethod === m.key && styles.payMethodActive]}
                                    >
                                        {m.icon}
                                        <Text style={[styles.payMethodText, paymentMethod === m.key && { color: '#fff' }]}>
                                            {m.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.confirmBtn}
                                onPress={handleConfirm}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Confirm & Collect</Text>}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* STEP 5: Success */}
                    {step === 5 && (
                        <View style={styles.success}>
                            <CheckCircle2 size={80} color="#67B1A1" />
                            <Text style={styles.successTitle}>Payment Recorded!</Text>
                            <Text style={styles.successSub}>
                                ₦{getEffectiveAmount(selectedItem, selectedPatient).toLocaleString()} collected from {selectedPatient?.full_name} via {paymentMethod.toUpperCase()}.
                            </Text>
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
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modal: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '90%', padding: 24 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    backBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 10 },
    title: { fontSize: 18, fontWeight: '900', color: '#000', flex: 1, textAlign: 'center' },
    closeBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 12 },
    dots: { flexDirection: 'row', gap: 6, marginBottom: 20, justifyContent: 'center' },
    dot: { width: 24, height: 4, borderRadius: 2, backgroundColor: '#F3F4F6' },
    dotActive: { backgroundColor: '#0D2E33' },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
        borderRadius: 16, paddingHorizontal: 16, height: 54, borderWidth: 1,
        borderColor: '#F3F4F6', marginBottom: 16,
    },
    input: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: '#000' },
    listItem: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    avatar: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#F3F4F6',
        justifyContent: 'center', alignItems: 'center', marginRight: 16,
    },
    avatarText: { fontSize: 16, fontWeight: '800', color: '#0D2E33' },
    itemName: { fontSize: 15, fontWeight: '700', color: '#000' },
    itemSubRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
    itemSub: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
    nhisBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 3 },
    nhisBadgeText: { fontSize: 9, fontWeight: '900', color: '#3B82F6' },
    iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    itemDept: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', marginTop: 2 },
    itemPrice: { fontSize: 14, fontWeight: '900', color: '#0D2E33' },
    nhisPrice: { color: '#3B82F6' },
    nhisLabel: { fontSize: 9, fontWeight: '900', color: '#3B82F6', textAlign: 'right' },
    empty: { textAlign: 'center', color: '#9CA3AF', fontWeight: '700', padding: 40, fontSize: 14 },
    selectedPatientCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4',
        padding: 14, borderRadius: 16, marginBottom: 20, gap: 12,
    },
    patientCardName: { fontSize: 15, fontWeight: '800', color: '#000' },
    nhisNote: { fontSize: 11, fontWeight: '700', color: '#3B82F6', marginTop: 2 },
    sectionLabel: { fontSize: 11, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 12 },
    deptGrid: { gap: 10, marginBottom: 16 },
    deptCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
        padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', gap: 12,
    },
    deptName: { fontSize: 14, fontWeight: '800', color: '#0D2E33', flex: 1 },
    skipDeptBtn: { padding: 16, alignItems: 'center' },
    skipDeptText: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', textDecorationLine: 'underline' },
    activeDeptBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4',
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginBottom: 12, gap: 6, alignSelf: 'flex-start',
    },
    activeDeptText: { fontSize: 12, fontWeight: '800', color: '#67B1A1', flex: 1 },
    confirmation: { flex: 1 },
    summaryCard: { backgroundColor: '#F9FAFB', padding: 20, borderRadius: 20, marginBottom: 20 },
    summaryLabel: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, marginBottom: 4 },
    summaryValue: { fontSize: 17, fontWeight: '900', color: '#000', marginBottom: 4 },
    summaryDept: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 4 },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
    totalLabel: { fontSize: 12, fontWeight: '800', color: '#000', marginBottom: 4 },
    totalValue: { fontSize: 32, fontWeight: '900', color: '#000', letterSpacing: -1 },
    nhisDiscount: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', marginTop: 4 },
    paymentMethods: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    payMethod: {
        flex: 1, height: 72, borderRadius: 16, backgroundColor: '#F9FAFB',
        justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6', gap: 6,
    },
    payMethodActive: { backgroundColor: '#0D2E33', borderColor: '#0D2E33' },
    payMethodText: { fontSize: 11, fontWeight: '900', color: '#0D2E33' },
    confirmBtn: {
        backgroundColor: '#0D2E33', height: 60, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center', marginTop: 'auto',
    },
    confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
    success: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
    successTitle: { fontSize: 24, fontWeight: '900', color: '#000', marginTop: 24, marginBottom: 8 },
    successSub: { fontSize: 14, fontWeight: '600', color: '#9CA3AF', textAlign: 'center', marginBottom: 40, paddingHorizontal: 24 },
});
