import { View, Text, StyleSheet, Image } from 'react-native';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    style?: any;
    url?: string;
}

const Logo = ({ size = 'md', style, url }: LogoProps) => {
    const isSmall = size === 'sm';
    const isMedium = size === 'md';
    const isLarge = size === 'lg';
    const isExtraLarge = size === 'xl';

    const fontSize = isSmall ? 14 : isMedium ? 18 : isLarge ? 24 : 32;
    const boxPadding = isSmall ? 4 : isMedium ? 6 : isLarge ? 10 : 14;
    const borderRadius = isSmall ? 4 : isMedium ? 8 : isLarge ? 12 : 16;
    const linesGap = isSmall ? 2 : isMedium ? 3 : isLarge ? 4 : 5;
    const lineHeight = isSmall ? 1.5 : isMedium ? 2 : isLarge ? 3 : 4;
    const imgHeight = isSmall ? 24 : isMedium ? 32 : isLarge ? 48 : 64;

    if (url) {
        return (
            <View style={[styles.container, style]}>
                <Image 
                    source={{ uri: url }} 
                    style={{ height: imgHeight, width: imgHeight * 3, borderRadius: 8 }} 
                    resizeMode="contain" 
                />
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            {/* Speed Lines */}
            <View style={[styles.linesContainer, { marginRight: isSmall ? 4 : 8 }]}>
                <View style={[styles.line, { width: 12, height: lineHeight, opacity: 0.4, marginBottom: linesGap }]} />
                <View style={[styles.line, { width: 22, height: lineHeight, opacity: 0.7, marginBottom: linesGap }]} />
                <View style={[styles.line, { width: 10, height: lineHeight, opacity: 0.2 }]} />
            </View>

            {/* "swift" Box */}
            <View style={[styles.box, { paddingHorizontal: boxPadding * 1.5, paddingVertical: boxPadding / 2, borderRadius }]}>
                <Text style={[styles.swiftText, { fontSize }]}>swift</Text>
            </View>

            {/* "Rev" Text */}
            <Text style={[styles.revText, { fontSize, marginLeft: 4 }]}>Rev</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    linesContainer: {
        alignItems: 'flex-end',
    },
    line: {
        backgroundColor: '#67B1A1',
        borderRadius: 2,
    },
    box: {
        backgroundColor: '#0D2E33',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    swiftText: {
        color: '#fff',
        fontWeight: '900',
        fontStyle: 'italic',
        includeFontPadding: false,
    },
    revText: {
        color: '#67B1A1',
        fontWeight: '900',
        fontStyle: 'italic',
        includeFontPadding: false,
    },
});

export default Logo;
