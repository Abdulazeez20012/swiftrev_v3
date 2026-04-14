import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    FlatList
} from 'react-native';
import {
    User,
    Phone,
    MapPin,
    Building,
    ChevronRight,
    Check,
    Clock,
    ArrowLeft,
    ShieldCheck,
    Layers,
    X
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSyncStore } from '../../src/store/useSyncStore';
import api from '../../src/services/api';

const PATIENT_TYPES = [
    { key: 'regular', label: 'Regular (Cash)', color: '#10B981', bg: '#F0FDF4' },
    { key: 'nhis', label: 'NHIS', color: '#3B82F6', bg: '#EFF6FF' },
    { key: 'capitation', label: 'Capitation', color: '#8B5CF6', bg: '#F5F3FF' },
    { key: 'retainer', label: 'Retainership', color: '#F59E0B', bg: '#FFFBEB' },
];

export default function PatientRegistration() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1=identity, 2=department, 3=extras

    const [departments, setDepartments] = useState<any[]>([]);
    const [loadingDepts, setLoadingDepts] = useState(false);
    const [selectedDept, setSelectedDept] = useState<any>(null);
    const [selectedPatientType, setSelectedPatientType] = useState('regular');

    const [form, setForm] = useState({
        fullName: '',
        phoneNumber: '',
        age: '',
        address: '',
        gender: 'other',
        insuranceNumber: '',
        email: ''
    });

    const { status, addToQueue, init, fetchDepartments: fetchDeptsWrapper } = useSyncStore();

    useEffect(() => {
        init();
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        if (!user?.hospitalId && user?.role !== 'super_admin') {
            setLoadingDepts(false);
            return;
        }
        setLoadingDepts(true);
        try {
            const data = await fetchDeptsWrapper(user?.hospitalId!);
            setDepartments(data);
        } catch (err: any) {
            console.error('Failed to fetch departments', err);
            // Even if it fails, the wrapper handles offline data
        } finally {
            setLoadingDepts(false);
        }
    };

    const handleNext = () => {
        if (step === 1) {
            if (!form.fullName || !form.phoneNumber) {
                Alert.alert('Required Fields', 'Please enter at least the name and phone number.');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!selectedDept) {
                Alert.alert('Department Required', 'Please select the department the patient is visiting.');
                return;
            }
            setStep(3);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        const payload = {
            hospitalId: user?.hospitalId,
            fullName: form.fullName,
            phoneNumber: form.phoneNumber,
            email: form.email,
            address: form.address,
            gender: form.gender,
            insuranceNumber: form.insuranceNumber,
            onboardedBy: user?.id,
            patientType: selectedPatientType,
            departmentId: selectedDept?.id,
        };

        setLoading(true);
        try {
            if (status === 'online') {
                await api.post('/patients', payload);
                Alert.alert('✅ Success', `${form.fullName} has been registered successfully.`);
                router.replace('/(tabs)');
            } else {
                await addToQueue('patient', payload);
                Alert.alert('Offline Mode', 'Patient saved locally and will sync when online.');
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            if (!error.response) {
                await addToQueue('patient', payload);
                Alert.alert('Offline Mode', 'Network issue. Patient saved locally and will sync automatically.');
                router.replace('/(tabs)');
            } else {
                Alert.alert('Registration Failed', error.response?.data?.message || 'Error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    const totalSteps = 3;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.topNav}>
                    {step > 1 && (
                        <TouchableOpacity onPress={() => setStep(s => s - 1)} style={styles.backBtn}>
                            <ArrowLeft size={20} color="#000" />
                        </TouchableOpacity>
                    )}
                    <View style={styles.badge}>
                        <ShieldCheck size={12} color="#10B981" />
                        <Text style={styles.badgeText}>Secure Entry</Text>
                    </View>
                </View>

                <View style={styles.header}>
                    <Text style={styles.stepIndicator}>Step {step} of {totalSteps}</Text>
                    <Text style={styles.title}>
                        {step === 1 && 'Patient Details'}
                        {step === 2 && 'Department Visit'}
                        {step === 3 && 'Additional Info'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {step === 1 && 'Enter the patient\'s name and contact information.'}
                        {step === 2 && 'Select the department the patient is visiting and their payment type.'}
                        {step === 3 && 'Optional extra information to complete the record.'}
                    </Text>
                </View>

                {/* Progress bars */}
                <View style={styles.stepper}>
                    {[1, 2, 3].map(s => (
                        <View key={s} style={[styles.stepBar, step >= s && styles.stepBarActive]} />
                    ))}
                </View>

                {/* STEP 1: Identity & Contact */}
                {step === 1 && (
                    <View style={styles.formSection}>
                        <Text style={styles.sectionLabel}>IDENTITY & CONTACT</Text>

                        <InputItem
                            label="Full Name"
                            placeholder="e.g. John Doe"
                            value={form.fullName}
                            onChangeText={(text: string) => setForm({ ...form, fullName: text })}
                            icon={<User size={18} color="#9CA3AF" />}
                        />

                        <InputItem
                            label="Phone Number"
                            placeholder="+234..."
                            keyboardType="phone-pad"
                            value={form.phoneNumber}
                            onChangeText={(text: string) => setForm({ ...form, phoneNumber: text })}
                            icon={<Phone size={18} color="#9CA3AF" />}
                        />

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Gender</Text>
                            <View style={styles.genderRow}>
                                {['male', 'female', 'other'].map(g => (
                                    <TouchableOpacity
                                        key={g}
                                        onPress={() => setForm({ ...form, gender: g })}
                                        style={[styles.genderBtn, form.gender === g && styles.genderBtnActive]}
                                    >
                                        <Text style={[styles.genderText, form.gender === g && styles.genderTextActive]}>
                                            {g.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                {/* STEP 2: Department + Patient Type */}
                {step === 2 && (
                    <View style={styles.formSection}>
                        <Text style={styles.sectionLabel}>VISITING DEPARTMENT</Text>

                        {loadingDepts ? (
                            <ActivityIndicator color="#67B1A1" style={{ marginVertical: 24 }} />
                        ) : (
                            <View style={styles.deptGrid}>
                                {departments.map(dept => (
                                    <TouchableOpacity
                                        key={dept.id}
                                        onPress={() => setSelectedDept(dept)}
                                        style={[
                                            styles.deptCard,
                                            selectedDept?.id === dept.id && styles.deptCardActive
                                        ]}
                                    >
                                        <Layers
                                            size={20}
                                            color={selectedDept?.id === dept.id ? '#fff' : '#0D2E33'}
                                        />
                                        <Text style={[
                                            styles.deptName,
                                            selectedDept?.id === dept.id && styles.deptNameActive
                                        ]}>
                                            {dept.name}
                                        </Text>
                                        {selectedDept?.id === dept.id && (
                                            <View style={styles.deptCheck}>
                                                <Check size={12} color="#fff" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                                {departments.length === 0 && (
                                    <View style={styles.emptyDepts}>
                                        <Text style={styles.emptyDeptsText}>No departments found. Continue anyway.</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>PATIENT TYPE / PAYMENT CATEGORY</Text>
                        <View style={styles.typeGrid}>
                            {PATIENT_TYPES.map(pt => (
                                <TouchableOpacity
                                    key={pt.key}
                                    onPress={() => setSelectedPatientType(pt.key)}
                                    style={[
                                        styles.typeCard,
                                        selectedPatientType === pt.key && {
                                            borderColor: pt.color,
                                            backgroundColor: pt.bg,
                                        }
                                    ]}
                                >
                                    <View style={[styles.typeDot, { backgroundColor: pt.color }]} />
                                    <Text style={[
                                        styles.typeLabel,
                                        selectedPatientType === pt.key && { color: pt.color, fontWeight: '900' }
                                    ]}>
                                        {pt.label}
                                    </Text>
                                    {selectedPatientType === pt.key && (
                                        <Check size={14} color={pt.color} style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* STEP 3: Supplementary Data */}
                {step === 3 && (
                    <View style={styles.formSection}>
                        <Text style={styles.sectionLabel}>SUPPLEMENTARY DATA</Text>

                        <InputItem
                            label="Residential Address"
                            placeholder="Street, City, State"
                            multiline
                            numberOfLines={3}
                            value={form.address}
                            onChangeText={(text: string) => setForm({ ...form, address: text })}
                            icon={<MapPin size={18} color="#9CA3AF" />}
                        />

                        {(selectedPatientType === 'nhis' || selectedPatientType === 'capitation') && (
                            <InputItem
                                label="Insurance / NHIS Number"
                                placeholder="NHIS or HMO ID"
                                value={form.insuranceNumber}
                                onChangeText={(text: string) => setForm({ ...form, insuranceNumber: text })}
                                icon={<ShieldCheck size={18} color="#9CA3AF" />}
                            />
                        )}

                        <InputItem
                            label="Email Address (Optional)"
                            placeholder="patient@example.com"
                            keyboardType="email-address"
                            value={form.email}
                            onChangeText={(text: string) => setForm({ ...form, email: text })}
                            icon={<User size={18} color="#9CA3AF" />}
                        />

                        {/* Summary preview */}
                        <View style={styles.summaryPreview}>
                            <Text style={styles.summaryPreviewTitle}>Registration Summary</Text>
                            <SummaryRow label="Name" value={form.fullName} />
                            <SummaryRow label="Phone" value={form.phoneNumber} />
                            <SummaryRow label="Department" value={selectedDept?.name || 'Not selected'} />
                            <SummaryRow label="Type" value={PATIENT_TYPES.find(p => p.key === selectedPatientType)?.label || 'Regular'} />
                        </View>
                    </View>
                )}

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={handleNext}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.nextButtonText}>
                                    {step === 1 && 'Next: Department'}
                                    {step === 2 && 'Next: Review & Finish'}
                                    {step === 3 && 'Register Patient'}
                                </Text>
                                {step < 3 ? <ChevronRight size={20} color="#fff" /> : <Check size={20} color="#fff" />}
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const SummaryRow = ({ label, value }: { label: string, value: string }) => (
    <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
    </View>
);

const InputItem = ({ label, icon, ...props }: any) => (
    <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputWrapper}>
            <View style={styles.iconContainer}>{icon}</View>
            <TextInput
                style={styles.input}
                placeholderTextColor="#9CA3AF"
                {...props}
            />
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scroll: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 40 },
    topNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32
    },
    backBtn: { padding: 10, backgroundColor: '#F3F4F6', borderRadius: 12 },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 100,
        gap: 5,
        marginLeft: 'auto',
    },
    badgeText: { fontSize: 10, fontWeight: '900', color: '#10B981', textTransform: 'uppercase' },
    header: { marginBottom: 24 },
    stepIndicator: { fontSize: 12, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    title: { fontSize: 28, fontWeight: '900', color: '#000', letterSpacing: -1, marginBottom: 8 },
    subtitle: { fontSize: 15, fontWeight: '600', color: '#9CA3AF', lineHeight: 22 },
    stepper: { flexDirection: 'row', gap: 8, marginBottom: 36 },
    stepBar: { flex: 1, height: 4, backgroundColor: '#F3F4F6', borderRadius: 2 },
    stepBarActive: { backgroundColor: '#0D2E33' },
    formSection: { marginBottom: 24 },
    sectionLabel: { fontSize: 11, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 20 },
    inputContainer: { marginBottom: 24 },
    label: { fontSize: 10, fontWeight: '900', color: '#000', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        minHeight: 56,
    },
    iconContainer: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, fontWeight: '700', color: '#000' },
    genderRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
    genderBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    genderBtnActive: { backgroundColor: '#0D2E33', borderColor: '#0D2E33' },
    genderText: { fontSize: 12, fontWeight: '800', color: '#6B7280' },
    genderTextActive: { color: '#fff' },
    // Department grid
    deptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    deptCard: {
        flexBasis: '47%',
        flexGrow: 1,
        padding: 16,
        borderRadius: 20,
        backgroundColor: '#F9FAFB',
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        gap: 8,
        position: 'relative',
    },
    deptCardActive: { backgroundColor: '#0D2E33', borderColor: '#0D2E33' },
    deptName: { fontSize: 14, fontWeight: '800', color: '#000', lineHeight: 18 },
    deptNameActive: { color: '#fff' },
    deptCheck: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#67B1A1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyDepts: {
        padding: 20,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        marginBottom: 8,
    },
    emptyDeptsText: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
    // Patient type
    typeGrid: { gap: 12 },
    typeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        backgroundColor: '#F9FAFB',
        gap: 12,
    },
    typeDot: { width: 10, height: 10, borderRadius: 5 },
    typeLabel: { fontSize: 14, fontWeight: '700', color: '#374151', flex: 1 },
    // Summary
    summaryPreview: {
        marginTop: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    summaryPreviewTitle: { fontSize: 12, fontWeight: '900', color: '#000', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    summaryLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
    summaryValue: { fontSize: 13, fontWeight: '800', color: '#000' },
    // Footer
    footer: { marginTop: 12 },
    nextButton: {
        backgroundColor: '#0D2E33',
        height: 64,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 6,
    },
    nextButtonText: { color: '#fff', fontSize: 17, fontWeight: '900' },
});
