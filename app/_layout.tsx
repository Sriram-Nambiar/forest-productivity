import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import '../src/polyfills';
import { useLevelStore } from '../src/store/levelStore'; // ← ADD
import { useSessionStore } from '../src/store/sessionStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { useWalletStore } from '../src/store/walletStore';

export default function RootLayout() {
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const loadSessions = useSessionStore((s) => s.loadSessions);
  const loadWalletSettings = useWalletStore((s) => s.loadWalletSettings);
  const loadLevelData = useLevelStore((s) => s.loadLevelData);     // ← ADD
  const darkMode = useSettingsStore((s) => s.darkMode);

  useEffect(() => {
    loadSettings();
    loadSessions();
    loadWalletSettings();
    loadLevelData();                                                // ← ADD
  }, [loadSettings, loadSessions, loadWalletSettings, loadLevelData]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style={darkMode ? 'light' : 'dark'} />
    </>
  );
}