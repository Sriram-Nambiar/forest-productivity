import { create } from "zustand";
import { STORAGE_KEYS } from "../constants";
import { safeGetItem, safeRemoveItem, safeSetItem } from "../utils/storage";
import type { ActiveSession, TimerStatus } from "../utils/types";

export type TreeStatus = "alive" | "dead";

interface TimerState {
  durationMinutes: number;
  remainingSeconds: number;
  status: TimerStatus;
  tree: { status: TreeStatus };
  startTime: number | null;
  pausedAt: number | null;

  setDuration: (minutes: number) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  tick: () => void;
  completeTimer: () => void;
  failTimer: () => void;
  reviveTree: () => void;
  resetTimer: () => void;
  restoreSession: () => Promise<boolean>;
  persistSession: () => Promise<void>;
  clearPersistedSession: () => Promise<void>;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  durationMinutes: 25,
  remainingSeconds: 25 * 60,
  status: "idle",
  tree: { status: "alive" },
  startTime: null,
  pausedAt: null,

  setDuration: (minutes: number) => {
    const state = get();
    // Allow changing duration only when not actively running or paused
    if (state.status === "running" || state.status === "paused") return;
    set({
      durationMinutes: minutes,
      remainingSeconds: minutes * 60,
      status: "idle",
      startTime: null,
      pausedAt: null,
    });
  },

  startTimer: () => {
    const state = get();
    if (state.status !== "idle") return;
    const now = Date.now();
    set({
      status: "running",
      // Always start with a living tree
      tree: { status: "alive" },
      startTime: now,
      remainingSeconds: state.durationMinutes * 60,
      pausedAt: null,
    });
  },

  pauseTimer: () => {
    const state = get();
    if (state.status !== "running") return;
    set({
      status: "paused",
      pausedAt: Date.now(),
    });
  },

  resumeTimer: () => {
    const state = get();
    if (state.status !== "paused") return;
    set({
      status: "running",
      pausedAt: null,
    });
  },

  tick: () => {
    const state = get();
    if (state.status !== "running") return;
    const newRemaining = Math.max(0, state.remainingSeconds - 1);
    set({ remainingSeconds: newRemaining });
  },

  completeTimer: () => {
    // Session completed successfully — tree survives
    set({
      status: "completed",
      tree: { status: "alive" },
      remainingSeconds: 0,
    });
  },

  failTimer: () => {
    // Session was cancelled — tree dies
    set({
      status: "failed",
      tree: { status: "dead" },
    });
  },

  reviveTree: () => {
    // Called after a successful SOL payment — restore tree and reset to idle
    const state = get();
    set({
      tree: { status: "alive" },
      status: "idle",
      remainingSeconds: state.durationMinutes * 60,
      startTime: null,
      pausedAt: null,
    });
  },

  resetTimer: () => {
    const state = get();
    set({
      status: "idle",
      remainingSeconds: state.durationMinutes * 60,
      startTime: null,
      pausedAt: null,
    });
  },

  restoreSession: async () => {
    const saved = await safeGetItem<ActiveSession>(STORAGE_KEYS.ACTIVE_SESSION);
    if (!saved || typeof saved !== "object") return false;

    if (saved.status === "running" || saved.status === "paused") {
      const elapsed = Math.floor((Date.now() - saved.startTime) / 1000);
      const totalSeconds = saved.durationMinutes * 60;
      const remaining = Math.max(0, totalSeconds - elapsed);

      if (remaining <= 0) {
        await safeRemoveItem(STORAGE_KEYS.ACTIVE_SESSION);
        return false;
      }

      set({
        durationMinutes: saved.durationMinutes,
        remainingSeconds: remaining,
        startTime: saved.startTime,
        // Restored sessions always have a living tree
        tree: { status: "alive" },
        status: "paused",
        pausedAt: Date.now(),
      });
      return true;
    }

    return false;
  },

  persistSession: async () => {
    const state = get();
    const data: ActiveSession = {
      durationMinutes: state.durationMinutes,
      remainingSeconds: state.remainingSeconds,
      startTime: state.startTime ?? Date.now(),
      status: state.status,
      pausedAt: state.pausedAt,
    };
    await safeSetItem(STORAGE_KEYS.ACTIVE_SESSION, data);
  },

  clearPersistedSession: async () => {
    await safeRemoveItem(STORAGE_KEYS.ACTIVE_SESSION);
  },
}));
