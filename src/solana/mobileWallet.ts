import { type Web3MobileWallet } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { PublicKey, type TransactionSignature } from "@solana/web3.js";
import bs58 from "bs58";
import type { SolanaCluster } from "./config";

// ─── App Identity (shown in wallet authorization prompts) ───
export const APP_IDENTITY = {
  name: "Forest Focus Timer",
  uri: "https://forestfocus.app",
  icon: "https://forestfocus.app/favicon.png",
} as const;

// ─── Types ───
export interface WalletAuthorizationState {
  authToken: string;
  walletUriBase: string;
  accountLabel: string | null;
  publicKey: PublicKey;
}

// ─── Helpers ───

/**
 * Maps our cluster string to the MWA chain identifier.
 */
export function clusterToChain(
  cluster: SolanaCluster,
): `solana:${SolanaCluster}` {
  return `solana:${cluster}`;
}

/**
 * Safely decode the wallet account address returned by MWA.
 *
 * MWA may return:
 *  - A Uint8Array of 32 bytes
 *  - A base58 string (Phantom)
 *  - A base64-encoded string (protocol spec)
 */
export function decodeWalletAddress(address: string | Uint8Array): PublicKey {
  // Raw bytes
  if (address instanceof Uint8Array) {
    if (address.length !== 32) {
      throw new Error(
        `Wallet returned invalid byte length (${address.length}), expected 32.`,
      );
    }
    return new PublicKey(address);
  }

  const trimmed = address.trim();
  if (!trimmed) {
    throw new Error("Wallet returned an empty account address.");
  }

  // Try direct base58 (most wallets)
  try {
    return new PublicKey(trimmed);
  } catch {
    // Not a valid base58 PublicKey — try base64 below.
  }

  // MWA protocol specifies base64-encoded 32-byte keys
  const normalized = trimmed.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = Buffer.from(normalized, "base64");
  if (decoded.length !== 32) {
    throw new Error("Wallet returned an invalid account address format.");
  }

  return new PublicKey(decoded);
}

/**
 * Extract a base58 signature string from either a raw Uint8Array or string.
 */
export function extractSignature(
  signature: TransactionSignature | Uint8Array,
): string {
  if (typeof signature === "string") {
    return signature;
  }
  return bs58.encode(signature);
}

// ─── Wallet Session Authorization ───

/**
 * Authorize (or re-authorize) the wallet session.
 * - If `existingAuthToken` is provided, attempts `reauthorize()` first.
 * - Falls back to `authorize()` if reauthorization fails.
 */
export async function authorizeWalletSession(
  wallet: Web3MobileWallet,
  cluster: SolanaCluster,
  existingAuthToken: string | null,
): Promise<WalletAuthorizationState> {
  const chain = clusterToChain(cluster);

  // Try reauthorize first if we have a previous auth token
  if (existingAuthToken) {
    try {
      const reauth = await wallet.reauthorize({
        auth_token: existingAuthToken,
        identity: APP_IDENTITY,
      });

      const account = reauth.accounts[0];
      if (!account) {
        throw new Error("Wallet returned no accounts on reauthorize.");
      }

      return {
        authToken: reauth.auth_token,
        walletUriBase: reauth.wallet_uri_base ?? "",
        accountLabel: account.label ?? null,
        publicKey: decodeWalletAddress(account.address),
      };
    } catch (reauthorizeError) {
      console.warn(
        "[authorizeWalletSession] Reauthorize failed, falling back to authorize:",
        reauthorizeError,
      );
      // Fall through to fresh authorize
    }
  }

  // Fresh authorization
  const auth = await wallet.authorize({
    chain,
    identity: APP_IDENTITY,
  });

  const account = auth.accounts[0];
  if (!account) {
    throw new Error("Wallet returned no accounts on authorize.");
  }

  return {
    authToken: auth.auth_token,
    walletUriBase: auth.wallet_uri_base ?? "",
    accountLabel: account.label ?? null,
    publicKey: decodeWalletAddress(account.address),
  };
}

// ─── Error Classification Helpers ───

export function isLikelyUserRejection(errorMessage: string): boolean {
  const lower = errorMessage.toLowerCase();
  return (
    lower.includes("cancel") ||
    lower.includes("rejected") ||
    lower.includes("declined") ||
    lower.includes("user declined")
  );
}

export function isLikelyWalletMissing(errorMessage: string): boolean {
  const lower = errorMessage.toLowerCase();
  return (
    lower.includes("not found") ||
    lower.includes("not installed") ||
    lower.includes("no compatible wallet") ||
    lower.includes("activity not found") ||
    lower.includes("connectionfailedexception") ||
    lower.includes("unable to connect to websocket server") ||
    lower.includes("failed to bind")
  );
}

export function isLikelyInsufficientFunds(errorMessage: string): boolean {
  const lower = errorMessage.toLowerCase();
  return (
    lower.includes("insufficient") ||
    lower.includes("not enough") ||
    lower.includes("0x1") // Solana custom error for insufficient funds
  );
}

export function isLikelyRpcFailure(errorMessage: string): boolean {
  const lower = errorMessage.toLowerCase();
  return (
    lower.includes("network") ||
    lower.includes("timeout") ||
    lower.includes("econnrefused") ||
    lower.includes("fetch failed") ||
    lower.includes("429") ||
    lower.includes("503") ||
    lower.includes("502")
  );
}

/**
 * Normalize any error value to a human-readable message string.
 */
export function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "An unknown error occurred.";
}
