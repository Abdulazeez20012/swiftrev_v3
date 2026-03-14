import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from 'react-native';
import {
    Cloud,
    CloudOff,
    RefreshCw,
    CheckCircle2,
    Database,
    Trash2,
    Clock,
    Zap
} from 'lucide-react-native';
import { useSyncStore } from '../../src/store/useSyncStore';
import { offlineStorage } from '../../src/services/OfflineStorage';

export default function SyncCenter() {
    const { status, pendingCount, lastSyncTime, progress, syncNow, init } = useSyncStore();

    useEffect(() => {
        init();
    }, []);

    const handleClearCache = () => {
        Alert.alert(
            "Clear Local Cache",
            "This will remove all locally cached patients and history. Sync queue will NOT be affected. Proceed?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                        await offlineStorage.delete('patients');
                        await offlineStorage.delete('revenue_items');
                        await offlineStorage.delete('history');
                        Alert.alert("Success", "Cache cleared successfully.");
                    }
                }
            ]
        );
    };

    const formatDate = (iso: string | null) => {
        if (!iso) return 'Never';
        return new Date(iso).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Sync Center</Text>
                <Text style={styles.subtitle}>Manage your offline data and synchronization healthy.</Text>
            </View>

            <View style={[styles.statusCard, status === 'offline' && styles.statusCardOffline]}>
                <View style={styles.statusHeader}>
                    <View style={[styles.statusIcon, status === 'online' ? styles.bgOnline : status === 'offline' ? styles.bgOffline : styles.bgSyncing]}>
                        {status === 'online' ? <Cloud size={24} color="#fff" /> :
                            status === 'offline' ? <CloudOff size={24} color="#fff" /> :
                                <RefreshCw size={24} color="#fff" />}
                    </View>
                    <View>
                        <Text style={styles.statusLabel}>Current Status</Text>
                        <Text style={styles.statusValue}>
                            {status === 'online' ? 'Connected' : status === 'offline' ? 'Offline' : 'Syncing Data...'}
                        </Text>
                    </View>
                </View>

                {status === 'syncing' && (
                    <View style={styles.progressSection}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{Math.round(progress * 100)}% Complete</Text>
                    </View>
                )}

                <View style={styles.divider} />

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Clock size={16} color="#9CA3AF" />
                        <Text style={styles.metaText}>Last Sync: {formatDate(lastSyncTime)}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{pendingCount}</Text>
                    <Text style={styles.statLabel}>Pending Syncs</Text>
                </View>
                <View style={styles.statBox}>
                    <Database size={20} color="#000" />
                    <Text style={styles.statLabel}>Local Storage Active</Text>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.syncButton, (status === 'syncing' || pendingCount === 0) && styles.syncButtonDisabled]}
                onPress={() => syncNow()}
                disabled={status === 'syncing' || pendingCount === 0}
            >
                {status === 'syncing' ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <RefreshCw size={20} color="#fff" style={{ marginRight: 10 }} />
                        <Text style={styles.syncButtonText}>Sync Now</Text>
                    </>
                )}
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Maintenance</Text>
            </View>

            <TouchableOpacity style={styles.dangerButton} onPress={handleClearCache}>
                <Trash2 size={20} color="#EF4444" style={{ marginRight: 10 }} />
                <Text style={styles.dangerButtonText}>Clear Local Cache</Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
                <Zap size={16} color="#6366F1" />
                <Text style={styles.infoText}>
                    SwiftRev automatically syncs data when you reconnect to the internet. Use "Sync Now" to force an immediate update.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 24,
    },
    header: {
        marginTop: 40,
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0D2E33',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#9CA3AF',
        marginTop: 4,
    },
    statusCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 32,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    statusCardOffline: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FEF3C7',
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    statusIcon: {
        width: 56,
        height: 56,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bgOnline: { backgroundColor: '#67B1A1' },
    bgOffline: { backgroundColor: '#F59E0B' },
    bgSyncing: { backgroundColor: '#0D2E33' },
    statusLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statusValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#000',
    },
    progressSection: {
        marginTop: 20,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#67B1A1',
    },
    progressText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#67B1A1',
        marginTop: 8,
        textAlign: 'right',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 20,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metaText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6B7280',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '900',
        color: '#000',
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    syncButton: {
        backgroundColor: '#0D2E33',
        height: 64,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    syncButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    syncButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#000',
    },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FEF2F2',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FEE2E2',
        marginBottom: 32,
    },
    dangerButtonText: {
        color: '#EF4444',
        fontSize: 15,
        fontWeight: '800',
    },
    infoBox: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#F5F3FF',
        borderRadius: 24,
        gap: 12,
        marginBottom: 40,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
        fontWeight: '600',
        color: '#67B1A1',
    }
});
