import React, { memo, useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../../constants';
import { computeTimeDistribution } from '../../utils/analyticsHelpers';
import type { FocusSession } from '../../utils/types';

interface TimeDistributionChartProps {
  sessions: FocusSession[];
  darkMode: boolean;
}

const CHART_W = Dimensions.get('window').width - 64;
const CHART_H = 140;
const BAR_RADIUS = 6;

const TimeDistributionChart = memo(function TimeDistributionChart({
  sessions,
  darkMode,
}: TimeDistributionChartProps) {
  const distribution = useMemo(() => computeTimeDistribution(sessions), [sessions]);
  const maxMinutes = useMemo(
    () => Math.max(1, ...distribution.map((d) => d.minutes)),
    [distribution],
  );

  const barColors = ['#FFA726', '#FF7043', '#AB47BC', '#42A5F5'];
  const barWidth = (CHART_W - 60) / 4;
  const gap = 12;

  return (
    <View style={[styles.card, darkMode && styles.cardDark]}>
      <Text style={[styles.cardTitle, darkMode && styles.textDark]}>Time Distribution</Text>

      <Svg width={CHART_W} height={CHART_H + 40}>
        {distribution.map((item, i) => {
          const barH = (item.minutes / maxMinutes) * CHART_H;
          const x = 10 + i * (barWidth + gap);
          const y = CHART_H - barH;

          return (
            <React.Fragment key={item.block}>
              {/* Bar */}
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barH, 2)}
                rx={BAR_RADIUS}
                fill={barColors[i]}
                opacity={0.85}
              />
              {/* Value on top */}
              {item.minutes > 0 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 6}
                  fontSize={11}
                  fontWeight="600"
                  fill={darkMode ? COLORS.textDark : COLORS.text}
                  textAnchor="middle"
                >
                  {item.minutes}m
                </SvgText>
              )}
              {/* Label below */}
              <SvgText
                x={x + barWidth / 2}
                y={CHART_H + 20}
                fontSize={10}
                fill={darkMode ? COLORS.textSecondaryDark : COLORS.textSecondary}
                textAnchor="middle"
              >
                {item.emoji} {item.block}
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
});

export { TimeDistributionChart };
