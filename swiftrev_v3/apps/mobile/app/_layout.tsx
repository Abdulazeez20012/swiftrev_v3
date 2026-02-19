import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/useAuthStore';

export default function RootLayout() {
    const { user, loading, restoreSession } = useAuthStore();
    const fragments = useSegments();
    const router = useRouter();

    useEffect(() => {
        restoreSession();
    }, []);

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = fragments[0] === '(tabs)';

        if (!user && inAuthGroup) {
            router.replace('/login');
        } else if (user && !inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [user, loading, fragments]);

    return (
        <>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="login" options={{ presentation: 'fullScreenModal' }} />
            </Stack>
            <StatusBar style="auto" />
        </>
    );
}
