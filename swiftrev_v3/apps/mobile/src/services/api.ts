import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL =
    typeof window !== 'undefined'
        ? `http://${window.location.hostname}:3000`
        : 'http://10.0.2.2:3000'; // Android emulator fallback

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
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
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('user');
            // Redirect logic should be handled by the router/state
        }
        return Promise.reject(error);
    }
);

export default api;
