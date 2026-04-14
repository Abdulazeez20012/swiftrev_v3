import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Theme } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

export const PremiumHeader = ({ title, showBack = false, onBack, rightElement }: any) => (
    <LinearGradient
        colors={[Theme.colors.primary, Theme.colors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
    >
        <View style={styles.headerContent}>
            {showBack && (
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    {/* Icon placeholder or use Lucide if imported */}
                    <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
                </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={{ marginLeft: 'auto' }}>{rightElement}</View>
        </View>
    </LinearGradient>
);

export const PremiumCard = ({ children, style, onPress }: { children: React.ReactNode, style?: StyleProp<ViewStyle>, onPress?: () => void }) => {

    const Container = onPress ? TouchableOpacity : View;
    return (
        <Container 
            style={[styles.card, Theme.shadows.md, style]} 
            onPress={onPress}
            activeOpacity={0.7}
        >
            {children}
        </Container>
    );
};

export const SegmentedControl = ({ options, selected, onSelect }: { options: string[], selected: string, onSelect: (val: string) => void }) => (
    <View style={styles.segmentedContainer}>
        {options.map((opt) => (
            <TouchableOpacity
                key={opt}
                onPress={() => onSelect(opt)}
                style={[
                    styles.segment,
                    selected === opt && styles.segmentActive
                ]}
            >
                <Text style={[
                    styles.segmentText,
                    selected === opt && styles.segmentTextActive
                ]}>
                    {opt}
                </Text>
            </TouchableOpacity>
        ))}
    </View>
);

const styles = StyleSheet.create({
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: Theme.spacing.lg,
        borderBottomLeftRadius: Theme.radius.xxl,
        borderBottomRightRadius: Theme.radius.xxl,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        ...Theme.typography.h2,
        color: Theme.colors.textWhite,
        textTransform: 'uppercase',
    },
    backBtn: {
        marginRight: Theme.spacing.md,
    },
    card: {
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radius.xl,
        padding: Theme.spacing.md,
    },
    segmentedContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: Theme.radius.md,
        padding: 4,
        marginVertical: Theme.spacing.md,
    },
    segment: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: Theme.radius.sm,
    },
    segmentActive: {
        backgroundColor: Theme.colors.surface,
        ...Theme.shadows.sm,
    },
    segmentText: {
        ...Theme.typography.label,
        color: Theme.colors.textMuted,
    },
    segmentTextActive: {
        color: Theme.colors.primary,
    },
});
