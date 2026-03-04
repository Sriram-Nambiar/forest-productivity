import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants';
import type { FocusSession } from '../../utils/types';

interface ForestStatsProps {
  sessions: FocusSession[];
  darkMode: boolean;
}

const ForestStats = memo(function ForestStats({ sessions, darkMode }: ForestStatsProps) {
  const stats = useMemo(() => {
    const completed = sessions.filter((s) => s.status === 'completed');
    const totalMinutes = completed.reduce((sum, s) => sum + s.durationMinutes, 0);
    const avgMinutes = completed.length > 0 ? Math.round(totalMinutes / completed.length) : 0;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return {
      totalTrees: completed.length,
      focusTime: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
      avgSession: `${avgMinutes}m`,
      failedCount: sessions.filter((s) => s.status === 'failed').length,
    };
  }, [sessions]);

  return (
    <View style={[styles.card, darkMode && styles.cardDark]}>
      <Text style={[styles.cardTitle, darkMode && styles.textDark]}>Session Stats</Text>
      <View style={styles.statsRow}>
        <StatItem
          emoji="🌳"
          label="Trees Grown"
          value={String(stats.totalTrees)}
          darkMode={darkMode}
        />
        <StatItem
          emoji="⏱️"
          label="Focus Time"
          value={stats.focusTime}
          darkMode={darkMode}
        />
        <StatItem
          emoji="📊"
          label="Avg Session"
          value={stats.avgSession}
          darkMode={darkMode}
        />
        <StatItem
          emoji="🥀"
          label="Failed"
          value={String(stats.failedCount)}
          darkMode={darkMode}
        />
      </View>
    </View>
  );
});

interface StatItemProps {
  emoji: string;
  label: string;
  value: string;
  darkMode: boolean;
}

const StatItem = memo(function StatItem({ emoji, label, value, darkMode }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, darkMode && styles.textDark]}>{value}</Text>
      <Text style={[styles.statLabel, darkMode && styles.subtextDark]}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardDark: {
    backgroundColor: COLORS.surfaceDark,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  textDark: {
    color: COLORS.textDark,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  subtextDark: {
    color: COLORS.textSecondaryDark,
  },
});

export { ForestStats };
