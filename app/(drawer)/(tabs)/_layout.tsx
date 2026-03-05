import { Tabs } from 'expo-router';
import { Settings, Timer, Trees, Wallet } from 'lucide-react-native';
import React from 'react';
import { COLORS } from '../../../src/constants';
import { useSettingsStore } from '../../../src/store/settingsStore';

export default function TabLayout() {
  const darkMode = useSettingsStore((s) => s.darkMode);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: darkMode ? COLORS.textSecondaryDark : COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: darkMode ? COLORS.surfaceDark : COLORS.surface,
          borderTopColor: darkMode ? COLORS.borderDark : COLORS.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Timer',
          tabBarIcon: ({ color, size }) => <Timer color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="forest"
        options={{
          title: 'Forest',
          tabBarIcon: ({ color, size }) => <Trees color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}