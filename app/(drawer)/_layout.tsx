import { Drawer } from 'expo-router/drawer';
import { Timer } from 'lucide-react-native';
import React from 'react';
import { COLORS } from '../../src/constants';
import { useSettingsStore } from '../../src/store/settingsStore';

export default function DrawerLayout() {
  const darkMode = useSettingsStore((s) => s.darkMode);

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: COLORS.primary,
        drawerInactiveTintColor: darkMode ? COLORS.textSecondaryDark : COLORS.textSecondary,
        drawerStyle: {
          backgroundColor: darkMode ? COLORS.surfaceDark : COLORS.surface,
        },
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '600',
        },
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: 'Home',
          drawerIcon: ({ color, size }) => <Timer color={color} size={size} />,
        }}
      />
    </Drawer>
  );
}