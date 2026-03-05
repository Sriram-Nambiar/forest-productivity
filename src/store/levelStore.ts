import { create } from "zustand";
import { STORAGE_KEYS } from "../constants";
import { safeGetItem, safeSetItem } from "../utils/storage";

// ─── Level thresholds ───
// Level N requires LEVEL_THRESHOLDS[N-1] total points
const LEVEL_THRESHOLDS = [
  0, // Level 1
  500, // Level 2
  1500, // Level 3
  3000, // Level 4
  5000, // Level 5
  8000, // Level 6
  12000, // Level 7
  17000, // Level 8
  23000, // Level 9
  30000, // Level 10
];

function calculateLevel(points: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

function getPointsForCurrentLevel(level: number): number {
  return LEVEL_THRESHOLDS[level - 1] ?? 0;
}

function getPointsForNextLevel(level: number): number {
  return (
    LEVEL_THRESHOLDS[level] ??
    LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 10000
  );
}

interface LevelData {
  totalPoints: number;
}

interface LevelState {
  totalPoints: number;
  level: number;
  pointsInCurrentLevel: number;
  pointsNeededForNextLevel: number;
  progressToNextLevel: number;
  loaded: boolean;
  loadLevelData: () => Promise<void>;
  addPoints: (minutes: number) => Promise<void>;
}

export const useLevelStore = create<LevelState>((set, get) => ({
  totalPoints: 0,
  level: 1,
  pointsInCurrentLevel: 0,
  pointsNeededForNextLevel: 500,
  progressToNextLevel: 0,
  loaded: false,

  loadLevelData: async () => {
    const saved = await safeGetItem<LevelData>(STORAGE_KEYS.LEVEL_DATA);
    if (
      saved &&
      typeof saved === "object" &&
      typeof saved.totalPoints === "number"
    ) {
      const level = calculateLevel(saved.totalPoints);
      const currentLevelStart = getPointsForCurrentLevel(level);
      const nextLevelStart = getPointsForNextLevel(level);
      const pointsInLevel = saved.totalPoints - currentLevelStart;
      const levelRange = nextLevelStart - currentLevelStart;
      set({
        totalPoints: saved.totalPoints,
        level,
        pointsInCurrentLevel: pointsInLevel,
        pointsNeededForNextLevel: levelRange,
        progressToNextLevel: levelRange > 0 ? pointsInLevel / levelRange : 1,
        loaded: true,
      });
    } else {
      set({ loaded: true });
    }
  },

  addPoints: async (minutes: number) => {
    const points = minutes * 10;
    const newTotal = get().totalPoints + points;
    const level = calculateLevel(newTotal);
    const currentLevelStart = getPointsForCurrentLevel(level);
    const nextLevelStart = getPointsForNextLevel(level);
    const pointsInLevel = newTotal - currentLevelStart;
    const levelRange = nextLevelStart - currentLevelStart;
    set({
      totalPoints: newTotal,
      level,
      pointsInCurrentLevel: pointsInLevel,
      pointsNeededForNextLevel: levelRange,
      progressToNextLevel: levelRange > 0 ? pointsInLevel / levelRange : 1,
    });
    await safeSetItem(STORAGE_KEYS.LEVEL_DATA, { totalPoints: newTotal });
  },
}));
