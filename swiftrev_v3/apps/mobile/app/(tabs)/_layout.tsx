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

import { Theme } from '../../src/theme';


export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: Theme.colors.primary,
            tabBarInactiveTintColor: Theme.colors.textMuted,
            tabBarStyle: {
                backgroundColor: Theme.colors.surface,
                borderTopColor: Theme.colors.border,
                height: 85,
                paddingBottom: 24,
                paddingTop: 8,
                ...Theme.shadows.lg,
            },
            tabBarLabelStyle: {
                ...Theme.typography.caption,
                fontSize: 10,
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
