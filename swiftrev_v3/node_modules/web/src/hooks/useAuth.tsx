import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';

interface User {
    id: string;
    email: string;
    role: string;
    hospitalId: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    hasPermission: (permission: string) => boolean;
    switchHospital: (hospitalId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { access_token, user: userData } = response.data;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
        } catch (error) {
            console.error('Login failed', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            const access_token = localStorage.getItem('access_token');
            if (access_token && user) {
                await api.post('/auth/logout', { userId: user.id });
            }
        } catch (error) {
            console.error('Logout error', error);
        } finally {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    const hasPermission = (_permission: string) => {
        if (!user) return false;
        if (user.role === 'super_admin') return true;
        return true;
    };

    const switchHospital = (hospitalId: string) => {
        if (!user) return;
        const updatedUser = { ...user, hospitalId };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.location.reload();
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            isAuthenticated: !!user,
            hasPermission,
            switchHospital
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
