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
    ActivityIndicator
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
    ShieldCheck
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSyncStore } from '../../src/store/useSyncStore';
import api from '../../src/services/api';

export default function PatientRegistration() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    const [form, setForm] = useState({
        fullName: '',
        phoneNumber: '',
        age: '',
        address: '',
        gender: 'other',
        insuranceNumber: '',
        email: ''
    });

    const handleNext = () => {
        if (step === 1) {
            if (!form.fullName || !form.phoneNumber) {
                Alert.alert('Required Fields', 'Please enter at least the name and phone number.');
                return;
            }
            setStep(2);
        } else {
            handleSubmit();
        }
    };

    const { status, addToQueue, init } = useSyncStore();

    useEffect(() => {
        init();
    }, []);

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
        };

        setLoading(true);
        try {
            if (status === 'online') {
                await api.post('/patients', payload);
                Alert.alert('Success', 'Patient onboarded successfully.');
                router.replace('/(tabs)');
            } else {
                // Offline or syncing
                await addToQueue('patient', payload);
                Alert.alert('Offline Mode', 'Patient saved locally and will sync when online.');
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            if (!error.response) {
                // Network error
                await addToQueue('patient', payload);
                Alert.alert('Offline Mode', 'Network issue detected. Patient saved locally and will sync when online.');
                router.replace('/(tabs)');
            } else {
                Alert.alert('Registration Failed', error.response?.data?.message || 'Error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.topNav}>
                    {step === 2 && (
                        <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                            <ArrowLeft size={20} color="#000" />
                        </TouchableOpacity>
                    )}
                    <View style={styles.badge}>
                        <ShieldCheck size={12} color="#10B981" />
                        <Text style={styles.badgeText}>Secure Entry</Text>
                    </View>
                </View>

                <View style={styles.header}>
                    <Text style={styles.title}>Register Patient</Text>
                    <Text style={styles.subtitle}>Onboard a new patient to {user?.hospitalId ? 'Hospital' : 'the system'}.</Text>
                </View>

                <View style={styles.stepper}>
                    <View style={[styles.stepBar, step >= 1 && styles.stepBarActive]} />
                    <View style={[styles.stepBar, step >= 2 && styles.stepBarActive]} />
                </View>

                {step === 1 ? (
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
                ) : (
                    <View style={styles.formSection}>
                        <Text style={styles.sectionLabel}>SUPPLEMENTARY DATA</Text>

                        <InputItem
                            label="Age"
                            placeholder="Years"
                            keyboardType="numeric"
                            value={form.age}
                            onChangeText={(text: string) => setForm({ ...form, age: text })}
                            icon={<Clock size={18} color="#9CA3AF" />}
                        />

                        <InputItem
                            label="Residential Address"
                            placeholder="Street, City, State"
                            multiline
                            numberOfLines={3}
                            value={form.address}
                            onChangeText={(text: string) => setForm({ ...form, address: text })}
                            icon={<MapPin size={18} color="#9CA3AF" />}
                        />

                        <InputItem
                            label="Insurance Number (Optional)"
                            placeholder="NHIS or HMO ID"
                            value={form.insuranceNumber}
                            onChangeText={(text: string) => setForm({ ...form, insuranceNumber: text })}
                            icon={<ShieldCheck size={18} color="#9CA3AF" />}
                        />

                        <InputItem
                            label="Email Address (Optional)"
                            placeholder="patient@example.com"
                            keyboardType="email-address"
                            value={form.email}
                            onChangeText={(text: string) => setForm({ ...form, email: text })}
                            icon={<User size={18} color="#9CA3AF" />}
                        />
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
                                    {step === 1 ? 'Continue to Details' : 'Finalize Registration'}
                                </Text>
                                {step === 1 ? <ChevronRight size={20} color="#fff" /> : <Check size={20} color="#fff" />}
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

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
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scroll: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    topNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    backBtn: {
        padding: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
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
    badgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#10B981',
        textTransform: 'uppercase',
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#000',
        letterSpacing: -1,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#9CA3AF',
        lineHeight: 22,
    },
    stepper: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 40,
    },
    stepBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#F3F4F6',
        borderRadius: 2,
    },
    stepBarActive: {
        backgroundColor: '#000',
    },
    formSection: {
        marginBottom: 32,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#9CA3AF',
        letterSpacing: 1.5,
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 10,
        fontWeight: '900',
        color: '#000',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        height: 56,
    },
    iconContainer: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    genderRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
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
    genderBtnActive: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    genderText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#6B7280',
    },
    genderTextActive: {
        color: '#fff',
    },
    footer: {
        marginTop: 12,
    },
    nextButton: {
        backgroundColor: '#000',
        height: 64,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 5,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
    }
});
