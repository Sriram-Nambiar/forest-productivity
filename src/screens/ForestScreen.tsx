import React, { useCallback, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnalyticsTabs } from '../components/forest/AnalyticsTabs';
import { DailyFocusRing } from '../components/forest/DailyFocusRing';
import { ForestCanvas } from '../components/forest/ForestCanvas';
import { ForestStats } from '../components/forest/ForestStats';
import { LevelCard } from '../components/forest/LevelCard';
import { SessionCalendar } from '../components/forest/SessionCalendar';
import { TimeDistributionChart } from '../components/forest/TimeDistributionChart';
import { COLORS } from '../constants';
import { useSessionStore } from '../store/sessionStore';
import { useSettingsStore } from '../store/settingsStore';

export default function ForestScreen() {
  const { sessions, loadSessions, clearSessions } = useSessionStore();
  const darkMode = useSettingsStore((s) => s.darkMode);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleClear = useCallback(() => {
    Alert.alert(
      'Clear Forest',
      'This will remove all your session history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearSessions(),
        },
      ],
    );
  }, [clearSessions]);

  const hasCompleted = sessions.filter((s) => s.status === 'completed').length > 0;

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, darkMode && styles.titleDark]}>My Forest</Text>
        {sessions.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Level + Points Card */}
        <LevelCard darkMode={darkMode} />

        {/* 2. Daily Focus Completion Circle */}
        <View style={styles.section}>
          <DailyFocusRing sessions={sessions} darkMode={darkMode} />
        </View>

        {/* 3. Forest Visualization */}
        <View style={styles.section}>
          <ForestCanvas sessions={sessions} darkMode={darkMode} />
        </View>

        {/* 4. Session Statistics */}
        <View style={styles.section}>
          <ForestStats sessions={sessions} darkMode={darkMode} />
        </View>

        {/* 5. Time Distribution Chart */}
        {hasCompleted && (
          <View style={styles.section}>
            <TimeDistributionChart sessions={sessions} darkMode={darkMode} />
          </View>
        )}

        {/* 6. Productivity Analytics Tabs */}
        {hasCompleted && (
          <View style={styles.section}>
            <AnalyticsTabs sessions={sessions} darkMode={darkMode} />
          </View>
        )}

        {/* 7. Calendar */}
        <View style={styles.section}>
          <SessionCalendar sessions={sessions} darkMode={darkMode} />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  containerDark: {
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  titleDark: {
    color: COLORS.primaryLight,
  },
  clearText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
  },
  scrollContent: {
    paddingTop: 4,
  },
  section: {
    marginTop: 16,
  },
  bottomPadding: {
    height: 40,
  },
});