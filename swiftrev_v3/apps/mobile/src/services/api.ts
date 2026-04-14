import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL =
    typeof window !== 'undefined'
        ? `http://${window.location.hostname}:3000`
        : 'http://10.0.2.2:3000'; // Android emulator fallback

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {},
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Use store's logout to clear state and storage
            const { useAuthStore } = require('../store/useAuthStore');
            const logout = useAuthStore.getState().logout;
            if (logout) await logout();
        }
        return Promise.reject(error);
    }
);

export default api;
