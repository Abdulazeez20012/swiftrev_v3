import React from 'react';
import { Tabs } from 'expo-router';
import {
    LayoutDashboard,
    UserPlus,
    UserCircle,
    History,
    Cloud,
    BarChart2
} from 'lucide-react-native';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#67B1A1',
            tabBarInactiveTintColor: '#9CA3AF',
            tabBarStyle: {
                backgroundColor: '#fff',
                borderTopColor: '#F3F4F6',
                height: 80,
                paddingBottom: 16,
                paddingTop: 8,
            },
            tabBarLabelStyle: {
                fontSize: 10,
                fontWeight: '800',
                letterSpacing: 0.5,
            },
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    headerShown: false,
                    tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="patients"
                options={{
                    title: 'Register',
                    headerShown: false,
                    tabBarIcon: ({ color }) => <UserPlus size={24} color={color} />,
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
                name="earnings"
                options={{
                    title: 'Earnings',
                    headerShown: false,
                    tabBarIcon: ({ color }) => <BarChart2 size={24} color={color} />,
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
            {/* Hidden from tabs but still routable */}
            <Tabs.Screen
                name="sync"
                options={{
                    title: 'Sync',
                    headerShown: false,
                    href: null,
                }}
            />
            <Tabs.Screen
                name="directory"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
