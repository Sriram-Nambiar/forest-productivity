import { create } from "zustand";
import { STORAGE_KEYS } from "../constants";
import { DEFAULT_CLUSTER, type SolanaCluster } from "../solana/config";
import { safeGetItem, safeSetItem } from "../utils/storage";

interface WalletState {
  /** Base58-encoded public key (null when disconnected) */
  publicKey: string | null;
  /** Active auth token returned by MWA authorize() */
  authToken: string | null;
  /** Wallet URI base returned by MWA authorize() */
  walletUriBase: string | null;
  /** Wallet account label */
  accountLabel: string | null;
  /** Currently selected Solana cluster */
  cluster: SolanaCluster;
  /** Whether a wallet operation is in progress */
  connecting: boolean;
  /** Last reward transaction timestamp for rate-limiting */
  lastRewardTimestamp: number;
  /** Most recent transaction signature */
  lastTxSignature: string | null;

  setPublicKey: (key: string | null) => void;
  setCluster: (cluster: SolanaCluster) => void;
  setConnecting: (value: boolean) => void;
  setLastRewardTimestamp: (ts: number) => void;
  setLastTxSignature: (sig: string | null) => void;
  setAuthorizationState: (params: {
    publicKey: string;
    authToken: string;
    walletUriBase: string;
    accountLabel: string | null;
  }) => void;
  clearAuthorization: () => void;
  loadWalletSettings: () => Promise<void>;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  publicKey: null,
  authToken: null,
  walletUriBase: null,
  accountLabel: null,
  cluster: DEFAULT_CLUSTER,
  connecting: false,
  lastRewardTimestamp: 0,
  lastTxSignature: null,

  setPublicKey: (key: string | null) => {
    set({ publicKey: key });
  },

  setAuthorizationState: ({
    publicKey,
    authToken,
    walletUriBase,
    accountLabel,
  }) => {
    set({
      publicKey,
      authToken,
      walletUriBase,
      accountLabel,
    });
  },

  clearAuthorization: () => {
    set({
      publicKey: null,
      authToken: null,
      walletUriBase: null,
      accountLabel: null,
      lastTxSignature: null,
    });
  },

  setCluster: (cluster: SolanaCluster) => {
    set({
      cluster,
      publicKey: null,
      authToken: null,
      walletUriBase: null,
      accountLabel: null,
      lastTxSignature: null,
    });
    safeSetItem(STORAGE_KEYS.WALLET_CLUSTER, cluster);
  },

  setConnecting: (value: boolean) => {
    set({ connecting: value });
  },

  setLastRewardTimestamp: (ts: number) => {
    set({ lastRewardTimestamp: ts });
  },

  setLastTxSignature: (sig: string | null) => {
    set({ lastTxSignature: sig });
  },

  loadWalletSettings: async () => {
    const saved = await safeGetItem<string>(STORAGE_KEYS.WALLET_CLUSTER);
    if (saved === "devnet" || saved === "mainnet-beta") {
      set({ cluster: saved });
    }
  },

  disconnect: () => {
    set({
      publicKey: null,
      authToken: null,
      walletUriBase: null,
      accountLabel: null,
      connecting: false,
      lastTxSignature: null,
    });
  },
}));
