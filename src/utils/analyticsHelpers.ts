import type { FocusSession } from "./types";

// ─── Time Distribution ───

export type TimeBlock = "Morning" | "Afternoon" | "Evening" | "Night";

export interface TimeDistribution {
  block: TimeBlock;
  minutes: number;
  emoji: string;
}

function getTimeBlock(hour: number): TimeBlock {
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
}

export function computeTimeDistribution(
  sessions: FocusSession[],
): TimeDistribution[] {
  const completed = sessions.filter((s) => s.status === "completed");
  const map: Record<TimeBlock, number> = {
    Morning: 0,
    Afternoon: 0,
    Evening: 0,
    Night: 0,
  };
  for (const s of completed) {
    const hour = new Date(s.startTime).getHours();
    const block = getTimeBlock(hour);
    map[block] += s.durationMinutes;
  }
  return [
    { block: "Morning", minutes: map.Morning, emoji: "🌅" },
    { block: "Afternoon", minutes: map.Afternoon, emoji: "☀️" },
    { block: "Evening", minutes: map.Evening, emoji: "🌆" },
    { block: "Night", minutes: map.Night, emoji: "🌙" },
  ];
}

// ─── Analytics Periods ───

export type AnalyticsPeriod = "Day" | "Week" | "Month" | "Year";

export interface AnalyticsBar {
  label: string;
  value: number;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function computeAnalytics(
  sessions: FocusSession[],
  period: AnalyticsPeriod,
): AnalyticsBar[] {
  const completed = sessions.filter((s) => s.status === "completed");
  const now = new Date();

  switch (period) {
    case "Day": {
      // Hourly breakdown for today
      const bars: AnalyticsBar[] = [];
      for (let h = 0; h < 24; h += 3) {
        const label = `${h.toString().padStart(2, "0")}`;
        const count = completed.filter((s) => {
          const d = new Date(s.startTime);
          return isSameDay(d, now) && d.getHours() >= h && d.getHours() < h + 3;
        }).length;
        bars.push({ label, value: count });
      }
      return bars;
    }
    case "Week": {
      // Last 7 days
      const bars: AnalyticsBar[] = [];
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        const dayStart = startOfDay(day);
        const count = completed.filter((s) =>
          isSameDay(new Date(s.startTime), dayStart),
        ).length;
        bars.push({ label: dayNames[day.getDay()], value: count });
      }
      return bars;
    }
    case "Month": {
      // Last 4 weeks
      const bars: AnalyticsBar[] = [];
      for (let w = 3; w >= 0; w--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - w * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        const count = completed.filter((s) => {
          const d = new Date(s.startTime);
          return d >= startOfDay(weekStart) && d <= weekEnd;
        }).length;
        bars.push({ label: `W${4 - w}`, value: count });
      }
      return bars;
    }
    case "Year": {
      // Last 12 months
      const bars: AnalyticsBar[] = [];
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      for (let m = 11; m >= 0; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const count = completed.filter((s) => {
          const sd = new Date(s.startTime);
          return (
            sd.getFullYear() === d.getFullYear() &&
            sd.getMonth() === d.getMonth()
          );
        }).length;
        bars.push({ label: monthNames[d.getMonth()], value: count });
      }
      return bars;
    }
  }
}

// ─── Calendar Marked Dates ───

export interface CalendarMarked {
  [date: string]: {
    marked: boolean;
    dotColor: string;
    sessions: number;
  };
}

export function computeCalendarDates(sessions: FocusSession[]): CalendarMarked {
  const completed = sessions.filter((s) => s.status === "completed");
  const map: CalendarMarked = {};
  for (const s of completed) {
    const d = new Date(s.startTime);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!map[key]) {
      map[key] = { marked: true, dotColor: "#4CAF50", sessions: 0 };
    }
    map[key].sessions += 1;
  }
  return map;
}
