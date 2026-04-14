import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/useAuthStore';
import { securityService } from '../src/services/SecurityService';

export default function RootLayout() {
    const { user, loading, restoreSession, logout } = useAuthStore();
    const fragments = useSegments();
    const router = useRouter();

    useEffect(() => {
        restoreSession();
    }, []);

    useEffect(() => {
        const checkBiometrics = async () => {
            if (user && !loading) {
                const auth = await securityService.authenticate();
                if (!auth) {
                    // Try again or logout? For now, we logout for security if they cancel biometric
                    logout();
                    router.replace('/login');
                }
            }
        };

        if (!loading) {
            const inAuthGroup = fragments[0] === '(tabs)';
            const isLoginPage = fragments[0] === 'login';
            const isProtectedRoute = !isLoginPage;

            if (!user && isProtectedRoute) {
                router.replace('/login');
            } else if (user && isLoginPage) {
                router.replace('/(tabs)');
            }
        }
    }, [user, loading, fragments]);

    return (
        <>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="login" options={{ presentation: 'fullScreenModal' }} />
                <Stack.Screen name="payment" options={{ presentation: 'card' }} />
                <Stack.Screen name="receipt" options={{ presentation: 'modal' }} />
                <Stack.Screen name="catalog" options={{ presentation: 'modal' }} />
                <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
                <Stack.Screen name="patient/[id]" options={{ title: 'Patient Profile' }} />
            </Stack>
            <StatusBar style="auto" />
        </>
    );
}
