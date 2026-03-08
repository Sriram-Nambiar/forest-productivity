export type SolanaCluster = "devnet";

export const DEFAULT_CLUSTER: SolanaCluster = "devnet";

/**
 * Devnet RPC provider URL.
 * Replace this single value to switch providers (Helius, QuickNode, Triton, etc).
 */
export const DEVNET_RPC_URL =
  "https://devnet.helius-rpc.com/?api-key=12275c27-0315-4026-8606-fbfeadd0cb9e";

/** Configurable treasury wallet address for reward deposits */
export const TREASURY_WALLET = "GKvEF5U4RYz4KDCzHMdVkPSTLMmt1d3bYNfuTxkvh3ni";

/** SOL amount transferred per completed focus session (in SOL) */
export const REWARD_AMOUNT_SOL = 0.001;

/** Rate-limit: minimum ms between reward transactions */
export const REWARD_COOLDOWN_MS = 60_000;

/** Tree NFT metadata URI (replace with your own hosted JSON). */
export const TREE_NFT_METADATA_URI =
  "https://arweave.net/placeholder-forest-focus-tree-metadata.json";

export const RPC_ENDPOINTS: Record<SolanaCluster, string> = {
  devnet: DEVNET_RPC_URL,
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
