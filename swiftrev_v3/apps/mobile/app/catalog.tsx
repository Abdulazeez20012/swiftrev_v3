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
    Tag,
    ArrowLeft,
    Info,
    ChevronRight,
    Banknote
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/useAuthStore';
import { useSyncStore } from '../src/store/useSyncStore';
import { offlineStorage } from '../src/services/OfflineStorage';
import api from '../src/services/api';

export default function ServiceCatalog() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { status } = useSyncStore();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchItems = async () => {
        try {
            if (status === 'online') {
                const res = await api.get(`/revenue-items?hospitalId=${user?.hospitalId}`);
                setItems(res.data);
                await offlineStorage.updateCache('revenue_items', res.data);
            } else {
                const cached = await offlineStorage.getAll('revenue_items');
                setItems(cached);
            }
        } catch (err) {
            console.error('Failed to fetch catalog', err);
            const cached = await offlineStorage.getAll('revenue_items');
            setItems(cached);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [status]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchItems();
    };

    const filteredItems = items.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.catalogCard}>
            <View style={styles.iconBox}>
                <Tag size={20} color="#67B1A1" />
            </View>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category || 'Standard Service'}</Text>
            </View>
            <View style={styles.priceTag}>
                <Text style={styles.priceValue}>₦{item.amount.toLocaleString()}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.topRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Price Catalog</Text>
                    <View style={{ width: 44 }} />
                </View>

                <View style={styles.searchBar}>
                    <Search size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search services or categories..."
                        placeholderTextColor="#9CA3AF"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#67B1A1" />
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#67B1A1" />
                    }
                    ListHeaderComponent={
                        <View style={styles.infoBanner}>
                            <Info size={16} color="#67B1A1" />
                            <Text style={styles.infoText}>Prices are subject to hospital policy updates.</Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Tag size={48} color="#E5E7EB" />
                            <Text style={styles.emptyText}>No services found matching your search.</Text>
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
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0D2E33',
    },
    searchBar: {
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
    list: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        padding: 12,
        borderRadius: 12,
        gap: 8,
        marginBottom: 20,
    },
    infoText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#67B1A1',
    },
    catalogCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000',
        marginBottom: 4,
    },
    itemCategory: {
        fontSize: 13,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    priceTag: {
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    priceValue: {
        fontSize: 15,
        fontWeight: '900',
        color: '#67B1A1',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#9CA3AF',
        fontWeight: '600',
    }
});
