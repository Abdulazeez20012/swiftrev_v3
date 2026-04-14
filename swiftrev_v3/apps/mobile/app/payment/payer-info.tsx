import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, User, Phone, Mail, IdCard } from 'lucide-react-native';
import { Theme } from '../../src/theme';
import { PremiumHeader, PremiumCard } from '../../src/components/PremiumUI';

const InputField = ({ label, value, onChange, icon, placeholder, keyboardType = 'default' }: any) => (
    <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputWrapper}>
            {icon}
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor={Theme.colors.textMuted}
                keyboardType={keyboardType}
            />
        </View>
    </View>
);

export default function PayerInfoScreen() {
    const router = useRouter();
    const [form, setForm] = useState({
        firstName: '',
        otherNames: '',
        patientNo: '',
        phone: '',
        email: '',
    });

    const handleNext = () => {
        // Basic validation
        if (!form.firstName || !form.phone) {
            alert('Please fill in required fields');
            return;
        }
        // Navigate to next step with params
        router.push({
            pathname: '/payment/add-revenue-item',
            params: { ...form }
        });
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: Theme.colors.background }}
        >
            <PremiumHeader title="Payer Information" showBack onBack={() => router.back()} />
            
            <ScrollView contentContainerStyle={styles.container}>
                <PremiumCard style={styles.formCard}>
                    <InputField 
                        label="PAYER FIRSTNAME *" 
                        value={form.firstName} 
                        onChange={(t: string) => setForm({ ...form, firstName: t })}
                        placeholder="Enter first name"
                        icon={<User size={20} color={Theme.colors.primary} />}
                    />
                    <InputField 
                        label="OTHER NAMES" 
                        value={form.otherNames} 
                        onChange={(t: string) => setForm({ ...form, otherNames: t })}
                        placeholder="Enter other names"
                        icon={<User size={20} color={Theme.colors.primary} />}
                    />
                    <InputField 
                        label="PATIENT NO. (IF ANY)" 
                        value={form.patientNo} 
                        onChange={(t: string) => setForm({ ...form, patientNo: t })}
                        placeholder="e.g. HOS-12345"
                        icon={<IdCard size={20} color={Theme.colors.primary} />}
                    />
                    <InputField 
                        label="PHONE NO. *" 
                        value={form.phone} 
                        onChange={(t: string) => setForm({ ...form, phone: t })}
                        placeholder="08012345678"
                        keyboardType="phone-pad"
                        icon={<Phone size={20} color={Theme.colors.primary} />}
                    />
                    <InputField 
                        label="EMAIL ADDRESS" 
                        value={form.email} 
                        onChange={(t: string) => setForm({ ...form, email: t })}
                        placeholder="example@mail.com"
                        keyboardType="email-address"
                        icon={<Mail size={20} color={Theme.colors.primary} />}
                    />
                </PremiumCard>

                <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                    <Text style={styles.nextBtnText}>NEXT STEP</Text>
                    <ChevronRight size={20} color="#fff" />
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Theme.spacing.md,
    },
    formCard: {
        padding: Theme.spacing.lg,
        gap: Theme.spacing.md,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        ...Theme.typography.caption,
        color: Theme.colors.textMuted,
        fontSize: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: Theme.radius.md,
        paddingHorizontal: Theme.spacing.md,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    input: {
        flex: 1,
        height: 50,
        marginLeft: Theme.spacing.sm,
        ...Theme.typography.body,
        fontSize: 14,
        color: Theme.colors.text,
    },
    nextBtn: {
        backgroundColor: Theme.colors.primaryLight,
        height: 60,
        borderRadius: Theme.radius.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Theme.spacing.xl,
        ...Theme.shadows.md,
    },
    nextBtnText: {
        ...Theme.typography.h3,
        color: '#fff',
        marginRight: 8,
    },
});
