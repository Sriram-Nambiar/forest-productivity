import { Connection } from "@solana/web3.js";
import { RPC_ENDPOINTS, type SolanaCluster } from "./config";

let cachedConnection: Connection | null = null;
let cachedCluster: SolanaCluster | null = null;

/**
 * Returns a memoised Connection instance.
 * Recreates the connection only when the cluster changes.
 *
 * Configured with:
 *  - 'confirmed' commitment for a balance between speed and safety
 *  - 30 s HTTP timeout to prevent hanging requests
 *  - wsEndpoint disabled (set to empty string) to avoid WebSocket errors on mobile
 */
export function getConnection(cluster: SolanaCluster): Connection {
  if (cachedConnection && cachedCluster === cluster) {
    return cachedConnection;
  }

  cachedConnection = new Connection(RPC_ENDPOINTS[cluster], {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 30_000,
    // Disable WebSocket to avoid "unable to connect to websocket" errors on mobile
    wsEndpoint: "",
  });

  cachedCluster = cluster;
  return cachedConnection;
}

/**
 * Force-reset the cached connection.
 * Useful after network errors or RPC failures.
 */
export function resetConnection(): void {
  cachedConnection = null;
  cachedCluster = null;
}
