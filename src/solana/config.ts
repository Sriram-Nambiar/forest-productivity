/**
 * ┌─────────────────────────────────────────────────────┐
 * │  Solana Network Configuration — Forest Focus App    │
 * │                                                      │
 * │  ⚠️  ALL network traffic uses Solana DEVNET only.   │
 * │  To switch RPC providers, change DEVNET_RPC_URL.    │
 * │  To switch API keys, update the api-key parameter.  │
 * └─────────────────────────────────────────────────────┘
 */

/** Only devnet is supported in this build. */
export type SolanaCluster = "devnet";

/** Default (and only) cluster for this app. */
export const DEFAULT_CLUSTER: SolanaCluster = "devnet";

/**
 * Devnet RPC endpoint.
 *
 * 🔧 TO CHANGE RPC PROVIDER:
 *    Replace this URL with your own (Helius, QuickNode, Triton, Alchemy, etc).
 *
 * 🔧 TO CHANGE API KEY:
 *    Update the `api-key` query parameter below.
 */
export const DEVNET_RPC_URL =
  "https://devnet.helius-rpc.com/?api-key=12275c27-0315-4026-8606-fbfeadd0cb9e";

/**
 * Map of cluster → RPC endpoint.
 * Only devnet is configured. If you add clusters in the future, add entries here.
 */
export const RPC_ENDPOINTS: Record<SolanaCluster, string> = {
  devnet: DEVNET_RPC_URL,
};

/** Configurable treasury wallet address for reward deposits. */
export const TREASURY_WALLET = "2C3NGzgqhok9dERmXKofHausXwnNT3y4SvRUSg3zXabx";

/** SOL amount transferred per completed focus session (in SOL). */
export const REWARD_AMOUNT_SOL = 0.001;

/**
 * SOL amount required to revive a dead tree (in SOL).
 * Sent to the treasury wallet on successful revival.
 */
export const REVIVE_COST_SOL = 0.001;

/** Rate-limit: minimum ms between reward transactions. */
export const REWARD_COOLDOWN_MS = 60_000;

/**
 * Tree NFT metadata URI.
 * 🔧 Replace with your own Arweave / IPFS hosted JSON for production.
 */
export const TREE_NFT_METADATA_URI =
  "https://arweave.net/placeholder-forest-focus-tree-metadata.json";

/**
 * Explorer URL templates keyed by cluster.
 * Use `{sig}` as a placeholder for the transaction signature.
 */
export const EXPLORER_BASE: Record<SolanaCluster, string> = {
  devnet: "https://solscan.io/tx/{sig}?cluster=devnet",
};

/**
 * Build a Solscan explorer URL for a given transaction signature.
 */
export function getExplorerUrl(
  signature: string,
  cluster: SolanaCluster = DEFAULT_CLUSTER,
): string {
  return EXPLORER_BASE[cluster].replace("{sig}", signature);
}
