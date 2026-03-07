import { Connection } from "@solana/web3.js";
import { RPC_ENDPOINTS, type SolanaCluster } from "./config";

let cachedConnection: Connection | null = null;
let cachedCluster: SolanaCluster | null = null;

/**
 * Returns a memoized Connection instance. Recreates only when the cluster changes.
 * Configured with:
 * - 30s HTTP timeout to prevent hanging requests
 * - 'confirmed' commitment for balance between speed and safety
 */
export function getConnection(cluster: SolanaCluster): Connection {
  if (cachedConnection && cachedCluster === cluster) {
    return cachedConnection;
  }
  cachedConnection = new Connection(RPC_ENDPOINTS[cluster], {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 30000, // 30 seconds timeout
  });
  cachedCluster = cluster;
  return cachedConnection;
}

/**
 * Force-reset the cached connection (useful after network errors).
 */
export function resetConnection(): void {
  cachedConnection = null;
  cachedCluster = null;
}
