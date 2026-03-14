import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import {
    Search,
    User,
    ChevronRight,
    UserPlus,
    Filter,
    Phone
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSyncStore } from '../../src/store/useSyncStore';
import { offlineStorage } from '../../src/services/OfflineStorage';
import api from '../../src/services/api';

export default function PatientDirectory() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { status, init } = useSyncStore();
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        init();
    }, []);

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
            console.error('Failed to fetch patients', err);
            const cached = await offlineStorage.getAll('patients');
            setPatients(cached);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, [status]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPatients();
    };

    const filteredPatients = patients.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderPatient = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.patientCard}
            onPress={() => router.push(`/patient/${item.id}`)}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.full_name?.charAt(0)}</Text>
            </View>
            <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{item.full_name}</Text>
                <View style={styles.patientSub}>
                    <Phone size={12} color="#9CA3AF" />
                    <Text style={styles.patientPhone}>{item.phone_number || 'No Phone'}</Text>
                </View>
            </View>
            <ChevronRight size={20} color="#E5E7EB" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Patient Directory</Text>
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Search size={20} color="#9CA3AF" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name or phone..."
                            placeholderTextColor="#9CA3AF"
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(tabs)/patients')}>
                        <UserPlus size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#67B1A1" />
                </View>
            ) : (
                <FlatList
                    data={filteredPatients}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderPatient}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#67B1A1" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <User size={48} color="#E5E7EB" />
                            <Text style={styles.emptyText}>No patients found matching your search.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 24,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0D2E33',
        letterSpacing: -1,
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    addButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#67B1A1',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#67B1A1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    list: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    patientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0D2E33',
    },
    patientInfo: {
        flex: 1,
    },
    patientName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#000',
        marginBottom: 4,
    },
    patientSub: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    patientPhone: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#9CA3AF',
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: 40,
    }
});
