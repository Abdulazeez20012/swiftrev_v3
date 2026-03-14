import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import {
    Bell,
    ArrowLeft,
    Info,
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    Search
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

const MOCK_NOTIFICATIONS = [
    {
        id: '1',
        type: 'info',
        title: 'System Maintenance',
        message: 'The server will be undergoing scheduled maintenance tonight at 11:00 PM.',
        time: '10m ago',
        isRead: false
    },
    {
        id: '2',
        type: 'success',
        title: 'Sync Successful',
        message: 'Your offline transactions have been successfully synced to the server.',
        time: '2h ago',
        isRead: true
    },
    {
        id: '3',
        type: 'warning',
        title: 'Low Stock Alert',
        message: 'Hospital inventory for standard medical kits is running low.',
        time: '5h ago',
        isRead: true
    }
];

export default function NotificationHub() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const renderIcon = (type: string) => {
        switch (type) {
            case 'info': return <Info size={20} color="#6366F1" />;
            case 'warning': return <AlertTriangle size={20} color="#F59E0B" />;
            case 'success': return <CheckCircle2 size={20} color="#10B981" />;
            default: return <Bell size={20} color="#6B7280" />;
        }
    };

    const renderItem = ({ item }: any) => (
        <TouchableOpacity style={[styles.notificationCard, !item.isRead && styles.unreadCard]}>
            <View style={[styles.iconBox, { backgroundColor: item.isRead ? '#F9FAFB' : '#fff' }]}>
                {renderIcon(item.type)}
            </View>
            <View style={{ flex: 1 }}>
                <View style={styles.notifHeader}>
                    <Text style={[styles.notifTitle, !item.isRead && styles.unreadText]}>{item.title}</Text>
                    <Text style={styles.notifTime}>{item.time}</Text>
                </View>
                <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
            </View>
            {!item.isRead && <View style={styles.unreadDot} />}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>Notifications</Text>
                <View style={{ width: 44 }} />
            </View>

            <FlatList
                data={MOCK_NOTIFICATIONS}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Bell size={48} color="#E5E7EB" />
                        <Text style={styles.emptyText}>You're all caught up!</Text>
                    </View>
                }
            />
        </View>
    );
}

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
        paddingBottom: 24,
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
    list: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    notificationCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        backgroundColor: '#F9FAFB',
        marginBottom: 12,
        alignItems: 'center',
        gap: 16,
    },
    unreadCard: {
        backgroundColor: '#F0F5F5',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    notifTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#6B7280',
    },
    unreadText: {
        color: '#000',
        fontWeight: '900',
    },
    notifTime: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    notifMessage: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
        lineHeight: 18,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#67B1A1',
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
