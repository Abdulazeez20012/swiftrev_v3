import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface User {
    id: string;
    email: string;
    role: string;
    hospitalId: string;
}

interface AuthState {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,

    restoreSession: async () => {
        try {
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                set({ user: JSON.parse(userStr) });
            }
        } catch (error) {
            console.error('Failed to restore session', error);
        } finally {
            set({ loading: false });
        }
    },

    login: async (email, password) => {
        set({ loading: true });
        try {
            const response = await api.post('/auth/login', { email, password });
            const { access_token, user } = response.data;

            await AsyncStorage.setItem('access_token', access_token);
            await AsyncStorage.setItem('user', JSON.stringify(user));

            set({ user, loading: false });
        } catch (error) {
            set({ loading: false });
            throw error;
        }
    },

    logout: async () => {
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('user');
        set({ user: null });
    },
}));
