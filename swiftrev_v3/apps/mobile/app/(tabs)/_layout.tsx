import React from 'react';
import { Tabs } from 'expo-router';
import {
    LayoutDashboard,
    UserPlus,
    User,
    UserCircle,
    History,
    Cloud
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: '#3b82f6', headerShown: true }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    headerShown: false,
                    tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="directory"
                options={{
                    title: 'Patients',
                    headerShown: false,
                    tabBarIcon: ({ color }) => <User size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'History',
                    headerShown: false,
                    tabBarIcon: ({ color }) => <History size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="sync"
                options={{
                    title: 'Sync',
                    headerShown: false,
                    tabBarIcon: ({ color }) => <Cloud size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    headerShown: false,
                    tabBarIcon: ({ color }) => <UserCircle size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
