import React, { memo, useCallback, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../../constants';
import {
    computeAnalytics,
    type AnalyticsPeriod,
} from '../../utils/analyticsHelpers';
import type { FocusSession } from '../../utils/types';

interface AnalyticsTabsProps {
  sessions: FocusSession[];
  darkMode: boolean;
}

const PERIODS: AnalyticsPeriod[] = ['Day', 'Week', 'Month', 'Year'];
const CHART_W = Dimensions.get('window').width - 64;
const CHART_H = 120;

const AnalyticsTabs = memo(function AnalyticsTabs({ sessions, darkMode }: AnalyticsTabsProps) {
  const [period, setPeriod] = useState<AnalyticsPeriod>('Week');

  const bars = useMemo(() => computeAnalytics(sessions, period), [sessions, period]);
  const maxVal = useMemo(() => Math.max(1, ...bars.map((b) => b.value)), [bars]);

  const barWidth = Math.max(8, (CHART_W - 20) / bars.length - 6);
  const gap = (CHART_W - 20 - barWidth * bars.length) / Math.max(1, bars.length - 1);

  const handlePress = useCallback((p: AnalyticsPeriod) => setPeriod(p), []);

  return (
    <View style={[styles.card, darkMode && styles.cardDark]}>
      <Text style={[styles.cardTitle, darkMode && styles.textDark]}>Productivity</Text>

      {/* Tab selector */}
      <View style={[styles.tabs, darkMode && styles.tabsDark]}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.tab, period === p && styles.tabActive]}
            onPress={() => handlePress(p)}
          >
            <Text
              style={[
                styles.tabText,
                darkMode && styles.tabTextDark,
                period === p && styles.tabTextActive,
              ]}
            >
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      <Svg width={CHART_W} height={CHART_H + 30}>
        {bars.map((bar, i) => {
          const barH = (bar.value / maxVal) * CHART_H;
          const x = 10 + i * (barWidth + gap);
          const y = CHART_H - barH;

          return (
            <React.Fragment key={`${period}-${i}`}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barH, 2)}
                rx={4}
                fill={COLORS.primary}
                opacity={bar.value > 0 ? 0.8 : 0.2}
              />
              {bar.value > 0 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 4}
                  fontSize={10}
                  fontWeight="600"
                  fill={darkMode ? COLORS.textDark : COLORS.text}
                  textAnchor="middle"
                >
                  {bar.value}
                </SvgText>
              )}
              <SvgText
                x={x + barWidth / 2}
                y={CHART_H + 16}
                fontSize={9}
                fill={darkMode ? COLORS.textSecondaryDark : COLORS.textSecondary}
                textAnchor="middle"
              >
                {bar.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tabsDark: {
    backgroundColor: '#1A2E1A',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextDark: {
    color: COLORS.textSecondaryDark,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});

export { AnalyticsTabs };
