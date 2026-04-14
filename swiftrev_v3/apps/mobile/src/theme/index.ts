export const Theme = {
    colors: {
        primary: '#0D2E33',        // Official SwiftRev Navy Green
        primaryLight: '#164E58',   // Lighter Navy Green for gradients
        primaryDark: '#051417',    // Even darker Navy
        secondary: '#67B1A1',      // Official Teal
        accent: '#F59E0B',         // Amber for warnings/offline
        success: '#10B981',        // Emerald Green
        error: '#EF4444',          // Red
        background: '#F8FAFC',     // Light slate
        surface: '#FFFFFF',        // White
        border: '#E2E8F0',         // Slate 200
        text: '#1E293B',           // Slate 800
        textMuted: '#64748B',      // Slate 500
        textWhite: '#FFFFFF',
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 40,
    },
    radius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        xxl: 32,
        full: 999,
    },
    shadows: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 10,
        },
    },
    typography: {
        h1: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
        h2: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
        h3: { fontSize: 20, fontWeight: '700' },
        body: { fontSize: 16, fontWeight: '500' },
        caption: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
        label: { fontSize: 14, fontWeight: '700' },
    }
} as const;
