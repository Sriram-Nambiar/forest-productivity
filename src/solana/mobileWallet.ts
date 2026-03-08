import { type Web3MobileWallet } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { PublicKey, type TransactionSignature } from "@solana/web3.js";
import bs58 from "bs58";
import type { SolanaCluster } from "./config";

export const APP_IDENTITY = {
  name: "Forest Focus Timer",
  uri: "https://forestfocus.app",
  icon: "https://forestfocus.app/favicon.png",
} as const;

export interface WalletAuthorizationState {
  authToken: string;
  walletUriBase: string;
  accountLabel: string | null;
  publicKey: PublicKey;
}

export function clusterToChain(
  cluster: SolanaCluster,
): `solana:${SolanaCluster}` {
  return `solana:${cluster}`;
}

export function decodeWalletAddress(address: string | Uint8Array): PublicKey {
  if (address instanceof Uint8Array) {
    return new PublicKey(address);
  }

  const trimmed = address.trim();
  if (!trimmed) {
    throw new Error("Wallet returned an empty account address.");
  }

  try {
    return new PublicKey(trimmed);
  } catch {
    // MWA accounts are base64-encoded according to the protocol.
  }

  const normalized = trimmed.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = Buffer.from(normalized, "base64");
  if (decoded.length !== 32) {
    throw new Error("Wallet returned an invalid account address format.");
  }

  return new PublicKey(decoded);
}

export function extractSignature(
  signature: TransactionSignature | Uint8Array,
): string {
  if (typeof signature === "string") {
    return signature;
  }
  return bs58.encode(signature);
}

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

function isLikelyModeMismatch(errorMessage: string): boolean {
  const lower = errorMessage.toLowerCase();
  return lower.includes("incorrect mode") || lower.includes("cluster");
}

function isLikelyInvalidAuthToken(errorMessage: string): boolean {
  const lower = errorMessage.toLowerCase();
  return (
    lower.includes("auth_token") ||
    lower.includes("auth token") ||
    lower.includes("not authorized") ||
    lower.includes("authorization")
  );
}

export function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function runAuthorize(
  wallet: Web3MobileWallet,
  cluster: SolanaCluster,
  authToken?: string | null,
) {
  return wallet.authorize({
    identity: APP_IDENTITY,
    chain: clusterToChain(cluster),
    auth_token: authToken ?? undefined,
  } as any);
}

export async function authorizeWalletSession(
  wallet: Web3MobileWallet,
  cluster: SolanaCluster,
  currentAuthToken?: string | null,
): Promise<WalletAuthorizationState> {
  let authorizationResult;

  try {
    authorizationResult = await runAuthorize(wallet, cluster, currentAuthToken);
  } catch (error: unknown) {
    const message = normalizeErrorMessage(error);

    // Wallet mode switched or token became stale; retry with a fresh authorization request.
    if (isLikelyModeMismatch(message) || isLikelyInvalidAuthToken(message)) {
      authorizationResult = await runAuthorize(wallet, cluster, null);
    } else {
      throw error;
    }
  }

  const account = authorizationResult.accounts[0];
  if (!account) {
    throw new Error("Wallet did not return any authorized account.");
  }

  return {
    authToken: authorizationResult.auth_token,
    walletUriBase: authorizationResult.wallet_uri_base,
    accountLabel: account.label ?? null,
    publicKey: decodeWalletAddress(account.address),
  };
}
