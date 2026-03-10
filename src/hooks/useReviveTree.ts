import {
  transact,
  type Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { REVIVE_COST_SOL } from "../solana/config";
import { getConnection } from "../solana/connection";
import {
  authorizeWalletSession,
  extractSignature,
  isLikelyInsufficientFunds,
  isLikelyRpcFailure,
  isLikelyUserRejection,
  isLikelyWalletMissing,
  normalizeErrorMessage,
} from "../solana/mobileWallet";
import {
  buildReviveTreeTransaction,
  confirmTransaction,
} from "../solana/transactions";
import { useTimerStore } from "../store/timerStore";
import { useWalletStore } from "../store/walletStore";

export interface UseReviveTreeResult {
  handleRevive: () => Promise<void>;
  isReviving: boolean;
  reviveError: string | null;
  clearReviveError: () => void;
}

export function useReviveTree(): UseReviveTreeResult {
  const [isReviving, setIsReviving] = useState(false);
  const [reviveError, setReviveError] = useState<string | null>(null);

  const reviveTree = useTimerStore((s) => s.reviveTree);

  const {
    publicKey,
    authToken,
    cluster,
    walletUriBase,
    setAuthorizationState,
    setLastTxSignature,
  } = useWalletStore();

  const clearReviveError = useCallback(() => {
    setReviveError(null);
  }, []);

  const handleRevive = useCallback(async () => {
    // ── Guard: wallet must be connected ──
    if (!publicKey) {
      setReviveError(
        "Wallet not connected. Please connect your wallet in the Wallet tab to revive your tree.",
      );
      return;
    }

    setIsReviving(true);
    setReviveError(null);

    try {
      const payerPk = new PublicKey(publicKey);

      // ── Pre-flight balance check ──
      // Require cost + ~5000 lamports buffer for transaction fees
      const connection = getConnection(cluster);
      const balanceLamports = await connection.getBalance(payerPk, "confirmed");
      const costLamports = Math.round(REVIVE_COST_SOL * LAMPORTS_PER_SOL);
      const requiredLamports = costLamports + 5_000;

      if (balanceLamports < requiredLamports) {
        throw new Error(
          `Insufficient SOL. You need at least ${(
            requiredLamports / LAMPORTS_PER_SOL
          ).toFixed(6)} SOL (${REVIVE_COST_SOL} SOL + fees), ` +
            `but your wallet only has ${(
              balanceLamports / LAMPORTS_PER_SOL
            ).toFixed(6)} SOL.`,
        );
      }

      // ── Build, sign & send transaction via Mobile Wallet Adapter ──
      const signatureStr = await transact(
        async (wallet: Web3MobileWallet) => {
          // Authorize (or re-authorize) the wallet session
          const auth = await authorizeWalletSession(wallet, cluster, authToken);

          // Keep the stored auth state fresh so subsequent requests re-use it
          setAuthorizationState({
            publicKey: auth.publicKey.toBase58(),
            authToken: auth.authToken,
            walletUriBase: auth.walletUriBase,
            accountLabel: auth.accountLabel,
          });

          // Build the revive transaction (SOL transfer to treasury)
          const tx = await buildReviveTreeTransaction(auth.publicKey, cluster);

          const signatures = await wallet.signAndSendTransactions({
            transactions: [tx],
          });

          const sig = signatures[0];
          if (!sig) {
            throw new Error(
              "Wallet returned no signature. The transaction may not have been sent.",
            );
          }

          return extractSignature(sig);
        },
        walletUriBase ? { baseUri: walletUriBase } : undefined,
      );

      // Store the signature so the Wallet screen can display it
      setLastTxSignature(signatureStr);

      // ── Wait for on-chain confirmation ──
      const confirmed = await confirmTransaction(signatureStr, cluster);
      if (!confirmed) {
        throw new Error(
          "Transaction was sent but could not be confirmed on-chain. " +
            "Please check your wallet for the transaction status and try again if needed.",
        );
      }

      // ── All good — revive the tree! ──
      reviveTree();

      Alert.alert(
        "Tree Revived! 🌱",
        `Your tree is alive again! ${REVIVE_COST_SOL} SOL was sent to the treasury.`,
        [{ text: "Let's Grow! 🌳", style: "default" }],
      );
    } catch (err: unknown) {
      const message = normalizeErrorMessage(err);
      console.error("[useReviveTree] handleRevive error:", message);

      if (isLikelyUserRejection(message)) {
        // User cancelled in the wallet app — not an error, just inform them
        setReviveError(
          "Transaction cancelled. Your tree is still waiting to be revived.",
        );
      } else if (isLikelyWalletMissing(message)) {
        setReviveError(
          "No compatible wallet found. Please install Phantom, Solflare, or Backpack and try again.",
        );
      } else if (isLikelyInsufficientFunds(message)) {
        setReviveError(
          `Not enough SOL. You need ${REVIVE_COST_SOL} SOL plus a small network fee to revive your tree.`,
        );
      } else if (isLikelyRpcFailure(message)) {
        setReviveError(
          "Network error. Could not reach Solana devnet. Please check your connection and try again.",
        );
      } else {
        setReviveError(message);
      }
    } finally {
      setIsReviving(false);
    }
  }, [
    publicKey,
    authToken,
    cluster,
    walletUriBase,
    setAuthorizationState,
    setLastTxSignature,
    reviveTree,
  ]);

  return { handleRevive, isReviving, reviveError, clearReviveError };
}
