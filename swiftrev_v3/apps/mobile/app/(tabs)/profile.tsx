import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert
} from 'react-native';
import {
    User,
    LogOut,
    Building2,
    Target,
    Award,
    Shield,
    Bell,
    ChevronRight,
    Settings,
    ShieldAlert
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import api from '../../src/services/api';
import { securityService } from '../../src/services/SecurityService';

export default function AgentProfile() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get(`/dashboard/agent?hospitalId=${user?.hospitalId}&agentId=${user?.id}`);
                setStats(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, []);

    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);

    useEffect(() => {
        const checkSecurity = async () => {
            const supported = await securityService.isSupported();
            const enabled = await securityService.isEnabled();
            setIsBiometricSupported(supported);
            setBiometricEnabled(enabled);
        };
        checkSecurity();
    }, []);

    const toggleBiometric = async () => {
        const newValue = !biometricEnabled;
        if (newValue) {
            const auth = await securityService.authenticate();
            if (!auth) return;
        }
        await securityService.setEnabled(newValue);
        setBiometricEnabled(newValue);
    };

    const handleNotifications = () => {
        router.push('/notifications');
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View>
                        <Text style={styles.name}>{user?.email?.split('@')[0] || 'Agent'}</Text>
                        <Text style={styles.role}>Field Collection Agent</Text>
                    </View>
                    <TouchableOpacity onPress={handleNotifications} style={styles.iconBtn}>
                        <Bell size={20} color="#000" />
                    </TouchableOpacity>
                </View>

                <View style={styles.hospitalCard}>
                    <Building2 size={24} color="#67B1A1" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.hospitalLabel}>Affiliated Hospital</Text>
                        <Text style={styles.hospitalName}>{user?.hospitalId || 'Main General Hospital'}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Performance Metrics</Text>
                <View style={styles.metricsGrid}>
                    <MetricCard
                        icon={<Target size={20} color="#6366F1" />}
                        label="Compliance"
                        value={`${stats?.performance || 0}%`}
                    />
                    <MetricCard
                        icon={<Award size={20} color="#F59E0B" />}
                        label="Total Collected"
                        value={`₦${(stats?.revenueTotal || 0).toLocaleString()}`}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account Settings</Text>
                <View style={styles.optionsList}>
                    {isBiometricSupported && (
                        <TouchableOpacity style={styles.optionItem} onPress={toggleBiometric}>
                            <View style={styles.optionIcon}>
                                <ShieldAlert size={20} color={biometricEnabled ? "#67B1A1" : "#6B7280"} />
                            </View>
                            <Text style={styles.optionLabel}>Biometric Access</Text>
                            <View style={[styles.toggle, biometricEnabled && styles.toggleActive]}>
                                <View style={[styles.toggleDot, biometricEnabled && styles.toggleDotActive]} />
                            </View>
                        </TouchableOpacity>
                    )}
                    <OptionItem icon={<Shield size={20} color="#6B7280" />} label="Security Settings" />
                    <OptionItem icon={<Bell size={20} color="#6B7280" />} label="Notification Preferences" />
                    <OptionItem icon={<Settings size={20} color="#6B7280" />} label="App Preferences" />
                </View>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                <LogOut size={20} color="#EF4444" />
                <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.versionText}>SwiftRev v3.0.0</Text>
                <Text style={styles.footerText}>Secure Hospital Revenue Management</Text>
            </View>
        </ScrollView>
    );
}

const MetricCard = ({ icon, label, value }: any) => (
    <View style={styles.metricCard}>
        {icon}
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
    </View>
);

const OptionItem = ({ icon, label }: any) => (
    <TouchableOpacity style={styles.optionItem}>
        <View style={styles.optionIcon}>{icon}</View>
        <Text style={styles.optionLabel}>{label}</Text>
        <ChevronRight size={18} color="#E5E7EB" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 24,
        backgroundColor: '#0D2E33',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
    },
    name: {
        fontSize: 24,
        fontWeight: '900',
        color: '#000',
    },
    role: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    iconBtn: {
        marginLeft: 'auto',
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hospitalCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    hospitalLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    hospitalName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0D2E33',
        marginTop: 2,
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#000',
        marginBottom: 16,
    },
    metricsGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    metricCard: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    metricValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#000',
        marginTop: 12,
    },
    metricLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
        marginTop: 4,
    },
    optionsList: {
        backgroundColor: '#F9FAFB',
        borderRadius: 24,
        padding: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#000',
    },
    logoutBtn: {
        marginHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        borderRadius: 20,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FEE2E2',
        gap: 10,
        marginBottom: 40,
    },
    logoutText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '900',
    },
    toggle: {
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#E5E7EB',
        padding: 2,
    },
    toggleActive: {
        backgroundColor: '#67B1A1',
    },
    toggleDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
    },
    toggleDotActive: {
        transform: [{ translateX: 20 }],
    },
    footer: {
        alignItems: 'center',
        paddingBottom: 40,
    },
    versionText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#D1D5DB',
    },
    footerText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#E5E7EB',
        marginTop: 4,
    }
});
