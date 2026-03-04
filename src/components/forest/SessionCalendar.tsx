import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { COLORS } from '../../constants';
import { computeCalendarDates } from '../../utils/analyticsHelpers';
import type { FocusSession } from '../../utils/types';

interface SessionCalendarProps {
  sessions: FocusSession[];
  darkMode: boolean;
}

const SessionCalendar = memo(function SessionCalendar({
  sessions,
  darkMode,
}: SessionCalendarProps) {
  const markedDates = useMemo(() => {
    const dates = computeCalendarDates(sessions);
    const result: Record<string, object> = {};
    for (const [key, val] of Object.entries(dates)) {
      result[key] = {
        marked: true,
        dotColor: COLORS.primary,
        selectedColor: COLORS.primary,
        customStyles: {
          container: {
            backgroundColor: `rgba(76, 175, 80, ${Math.min(0.2 + val.sessions * 0.15, 0.8)})`,
            borderRadius: 8,
          },
          text: {
            color: darkMode ? COLORS.textDark : COLORS.text,
            fontWeight: '600',
          },
        },
      };
    }
    return result;
  }, [sessions, darkMode]);

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: 'transparent',
      calendarBackground: 'transparent',
      textSectionTitleColor: darkMode ? COLORS.textSecondaryDark : COLORS.textSecondary,
      dayTextColor: darkMode ? COLORS.textDark : COLORS.text,
      todayTextColor: COLORS.primary,
      todayBackgroundColor: darkMode ? '#1A2E1A' : '#E8F5E9',
      monthTextColor: darkMode ? COLORS.textDark : COLORS.text,
      arrowColor: COLORS.primary,
      textDisabledColor: darkMode ? '#444' : '#CCC',
      textMonthFontWeight: '700' as const,
      textDayFontSize: 14,
      textMonthFontSize: 16,
    }),
    [darkMode],
  );

  return (
    <View style={[styles.card, darkMode && styles.cardDark]}>
      <Text style={[styles.cardTitle, darkMode && styles.textDark]}>Session Calendar</Text>
      <Calendar
        markedDates={markedDates}
        markingType="custom"
        theme={calendarTheme}
        enableSwipeMonths
      />
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
    marginBottom: 8,
  },
  textDark: {
    color: COLORS.textDark,
  },
});

export { SessionCalendar };
