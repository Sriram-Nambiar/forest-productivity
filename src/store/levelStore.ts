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

const LEVEL_TITLES: Record<number, string> = {
  1: "Seedling",
  2: "Sprout",
  3: "Sapling",
  4: "Young Tree",
  5: "Tree",
  6: "Tall Tree",
  7: "Oak",
  8: "Ancient Oak",
  9: "Elder Tree",
  10: "Forest Guardian",
};

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

function getLevelTitle(level: number): string {
  return LEVEL_TITLES[level] ?? "Forest Guardian";
}

interface LevelData {
  totalPoints: number;
}

interface LevelState {
  totalPoints: number;
  level: number;
  title: string;
  pointsInCurrentLevel: number;
  pointsNeededForNextLevel: number;
  progressToNextLevel: number;
  loaded: boolean;
  loadLevelData: () => Promise<void>;
  addPoints: (minutes: number) => Promise<void>;
}

function computeDerivedState(totalPoints: number) {
  const level = calculateLevel(totalPoints);
  const currentLevelStart = getPointsForCurrentLevel(level);
  const nextLevelStart = getPointsForNextLevel(level);
  const pointsInLevel = totalPoints - currentLevelStart;
  const levelRange = nextLevelStart - currentLevelStart;
  return {
    totalPoints,
    level,
    title: getLevelTitle(level),
    pointsInCurrentLevel: pointsInLevel,
    pointsNeededForNextLevel: levelRange,
    progressToNextLevel: levelRange > 0 ? pointsInLevel / levelRange : 1,
  };
}

export const useLevelStore = create<LevelState>((set, get) => ({
  totalPoints: 0,
  level: 1,
  title: "Seedling",
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
      set({
        ...computeDerivedState(saved.totalPoints),
        loaded: true,
      });
    } else {
      set({ loaded: true });
    }
  },

  addPoints: async (minutes: number) => {
    // Points formula: 10 points per minute of focus
    const earned = Math.max(0, Math.round(minutes * 10));
    const newTotal = get().totalPoints + earned;

    set({
      ...computeDerivedState(newTotal),
    });

    await safeSetItem(STORAGE_KEYS.LEVEL_DATA, { totalPoints: newTotal });
  },
}));
