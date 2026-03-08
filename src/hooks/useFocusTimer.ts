import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef } from "react";
import { Alert, AppState, type AppStateStatus } from "react-native";
import { GRACE_PERIOD_MS, TIMER_INTERVAL_MS } from "../constants";
import { mintTreeNFT } from "../solana/nft";
import { useLevelStore } from "../store/levelStore";
import { useSessionStore } from "../store/sessionStore";
import { useSettingsStore } from "../store/settingsStore";
import { useTimerStore } from "../store/timerStore";
import { useWalletStore } from "../store/walletStore";
import { generateId, getProgress, getTreeStage } from "../utils/helpers";
import type { FocusSession } from "../utils/types";

export function useFocusTimer() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const graceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const {
    durationMinutes,
    remainingSeconds,
    status,
    tick,
    completeTimer,
    failTimer,
    resetTimer,
    persistSession,
    clearPersistedSession,
  } = useTimerStore();

  const addSession = useSessionStore((s) => s.addSession);
  const strictMode = useSettingsStore((s) => s.strictMode);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const addPoints = useLevelStore((s) => s.addPoints);

  const walletPublicKey = useWalletStore((s) => s.publicKey);
  const walletCluster = useWalletStore((s) => s.cluster);
  const walletAuthToken = useWalletStore((s) => s.authToken);
  const walletUriBase = useWalletStore((s) => s.walletUriBase);
  const setAuthorizationState = useWalletStore((s) => s.setAuthorizationState);
  const setLastTxSignature = useWalletStore((s) => s.setLastTxSignature);

  const totalSeconds = durationMinutes * 60;
  const progress = getProgress(remainingSeconds, totalSeconds);
  const treeStage = getTreeStage(progress);

  const clearInterval_ = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const clearGrace = useCallback(() => {
    if (graceRef.current !== null) {
      clearTimeout(graceRef.current);
      graceRef.current = null;
    }
  }, []);

  const saveSession = useCallback(
    async (sessionStatus: "completed" | "failed") => {
      const timerState = useTimerStore.getState();
      const session: FocusSession = {
        id: generateId(),
        durationMinutes,
        startTime: timerState.startTime ?? Date.now(),
        endTime: Date.now(),
        status: sessionStatus,
        treeStage:
          sessionStatus === "completed" ? "full" : getTreeStage(progress),
      };
      await addSession(session);
      await clearPersistedSession();
    },
    [durationMinutes, progress, addSession, clearPersistedSession],
  );

  /**
   * Attempt to mint a Tree NFT after focus session completes.
   * This is fire-and-forget — failure does not block the session completion.
   */
  const tryMintTreeNFT = useCallback(async () => {
    if (!walletPublicKey) {
      console.log("[tryMintTreeNFT] No wallet connected, skipping NFT mint.");
      return;
    }

    try {
      const signature = await mintTreeNFT(
        walletCluster,
        walletAuthToken,
        walletUriBase,
        (authUpdate) => {
          setAuthorizationState(authUpdate);
        },
      );

      if (signature) {
        setLastTxSignature(signature);
        Alert.alert(
          "🌳 Tree NFT Minted!",
          "Your focus session tree has been minted as an NFT on Solana Devnet.",
        );
      }
    } catch (error) {
      console.warn("[tryMintTreeNFT] NFT mint failed (non-blocking):", error);
    }
  }, [
    walletPublicKey,
    walletCluster,
    walletAuthToken,
    walletUriBase,
    setAuthorizationState,
    setLastTxSignature,
  ]);

  const handleComplete = useCallback(async () => {
    clearInterval_();
    completeTimer();

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics not available
    }

    if (notificationsEnabled) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Focus Complete! 🌳",
            body: `Great job! Your ${durationMinutes}-minute focus session is complete.`,
          },
          trigger: null,
        });
      } catch {
        // Notifications not available
      }
    }

    await saveSession("completed");
    await addPoints(durationMinutes);

    // Attempt NFT mint (non-blocking)
    tryMintTreeNFT();
  }, [
    clearInterval_,
    completeTimer,
    notificationsEnabled,
    durationMinutes,
    saveSession,
    addPoints,
    tryMintTreeNFT,
  ]);

  const handleFail = useCallback(async () => {
    clearInterval_();
    clearGrace();
    failTimer();

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Haptics not available
    }

    await saveSession("failed");
  }, [clearInterval_, clearGrace, failTimer, saveSession]);

  // Timer interval
  useEffect(() => {
    if (status === "running") {
      intervalRef.current = setInterval(() => {
        const state = useTimerStore.getState();
        if (state.remainingSeconds <= 1) {
          handleComplete();
        } else {
          tick();
        }
      }, TIMER_INTERVAL_MS);
    } else {
      clearInterval_();
    }

    return clearInterval_;
  }, [status, tick, handleComplete, clearInterval_]);

  // Persist session periodically
  useEffect(() => {
    if (status === "running" || status === "paused") {
      persistSession();
    }
  }, [status, remainingSeconds, persistSession]);

  // AppState listener for distraction detection
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        const prevState = appStateRef.current;
        appStateRef.current = nextState;

        const timerState = useTimerStore.getState();

        // Only care if timer is running
        if (timerState.status !== "running") return;

        // User left the app
        if (prevState === "active" && nextState !== "active") {
          if (strictMode) {
            // Strict mode: fail immediately
            handleFail();
          } else {
            // Grace period
            clearGrace();
            graceRef.current = setTimeout(() => {
              const currentState = useTimerStore.getState();
              if (currentState.status === "running") {
                handleFail();
              }
            }, GRACE_PERIOD_MS);
          }
        }

        // User returned to the app — cancel grace timer
        if (prevState !== "active" && nextState === "active") {
          clearGrace();
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [strictMode, handleFail, clearGrace]);

  return {
    durationMinutes,
    remainingSeconds,
    status,
    progress,
    treeStage,
    handleFail,
    resetTimer,
  };
}
