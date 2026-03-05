import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, DAILY_FOCUS_GOAL_MINUTES } from '../../constants';
import type { FocusSession } from '../../utils/types';

interface DailyFocusRingProps {
  sessions: FocusSession[];
  darkMode: boolean;
}

const RING_SIZE = 160;
const STROKE_WIDTH = 12;

const DailyFocusRing = memo(function DailyFocusRing({
  sessions,
  darkMode,
}: DailyFocusRingProps) {
  const todayMinutes = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return sessions
      .filter((s) => s.status === 'completed' && s.startTime >= startOfDay)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [sessions]);

  const goal = DAILY_FOCUS_GOAL_MINUTES;
  const progress = Math.min(todayMinutes / goal, 1);
  const radius = (RING_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  const percentage = Math.round(progress * 100);

  return (
    <View style={[styles.card, darkMode && styles.cardDark]}>
      <Text style={[styles.cardTitle, darkMode && styles.textDark]}>Daily Focus Goal</Text>
      <View style={styles.ringContainer}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          {/* Background track */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={radius}
            stroke={darkMode ? 'rgba(76,175,80,0.1)' : 'rgba(76,175,80,0.15)'}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Progress arc */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={radius}
            stroke={progress >= 1 ? COLORS.success : COLORS.primaryLight}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${circumference},${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        </Svg>
        {/* Center text */}
        <View style={styles.centerText}>
          <Text style={[styles.percentText, darkMode && styles.textDark]}>
            {percentage}%
          </Text>
          <Text style={[styles.minutesText, darkMode && styles.subtextDark]}>
            {todayMinutes}/{goal}m
          </Text>
        </View>
      </View>
      {progress >= 1 && (
        <Text style={styles.completedText}>🎉 Goal reached!</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
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
    alignSelf: 'flex-start',
  },
  textDark: {
    color: COLORS.textDark,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
  },
  percentText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
  minutesText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  subtextDark: {
    color: COLORS.textSecondaryDark,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
    marginTop: 8,
  },
});

export { DailyFocusRing };
