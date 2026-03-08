export type SolanaCluster = "devnet";

export const DEFAULT_CLUSTER: SolanaCluster = "devnet";

/** Configurable treasury wallet address for reward deposits */
export const TREASURY_WALLET = "GKvEF5U4RYz4KDCzHMdVkPSTLMmt1d3bYNfuTxkvh3ni";

/** SOL amount transferred per completed focus session (in SOL) */
export const REWARD_AMOUNT_SOL = 0.001;

/** Rate-limit: minimum ms between reward transactions */
export const REWARD_COOLDOWN_MS = 60_000;

export const RPC_ENDPOINTS: Record<SolanaCluster, string> = {
  devnet: "https://api.devnet.solana.com",
};

export const EXPLORER_BASE: Record<SolanaCluster, string> = {
  devnet: "https://solscan.io/tx/{sig}?cluster=devnet",
};

export function getExplorerUrl(
  signature: string,
  cluster: SolanaCluster,
): string {
  return EXPLORER_BASE[cluster].replace("{sig}", signature);
}
