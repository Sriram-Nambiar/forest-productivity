
export type SolanaCluster = "devnet" | "mainnet-beta";

export const DEFAULT_CLUSTER: SolanaCluster = "devnet";

/** Configurable treasury wallet address for reward deposits */
export const TREASURY_WALLET = "GKvEF5U4RYz4KDCzHMdVkPSTLMmt1d3bYNfuTxkvh3ni";

/** SOL amount transferred per completed focus session (in SOL) */
export const REWARD_AMOUNT_SOL = 0.001;

/** Rate-limit: minimum ms between reward transactions */
export const REWARD_COOLDOWN_MS = 60_000;

/**
 * RPC endpoints — using more reliable endpoints than the default public ones.
 * The public api.devnet.solana.com is heavily rate-limited and will cause
 * getLatestBlockhash() and confirmTransaction() to timeout.
 *
 * Replace these with your own RPC provider (Helius, QuickNode, etc.) for production.
 */
export const RPC_ENDPOINTS: Record<SolanaCluster, string> = {
  devnet: "https://api.devnet.solana.com",
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
};

export const EXPLORER_BASE: Record<SolanaCluster, string> = {
  devnet: "https://solscan.io/tx/{sig}?cluster=devnet",
  "mainnet-beta": "https://solscan.io/tx/{sig}",
};

export function getExplorerUrl(
  signature: string,
  cluster: SolanaCluster,
): string {
  return EXPLORER_BASE[cluster].replace("{sig}", signature);
}
