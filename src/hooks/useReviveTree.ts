import {
  transact,
  type Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { REVIVE_COST_SOL, TREASURY_WALLET } from "../solana/config";
import { APP_IDENTITY } from "../solana/mobileWallet";
import { useTimerStore } from "../store/timerStore";
import { useWalletStore } from "../store/walletStore";

/** Revive cost in lamports */
const REVIVE_COST_LAMPORTS = Math.round(REVIVE_COST_SOL * LAMPORTS_PER_SOL);

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
    walletUriBase,
    setAuthorizationState,
    setLastTxSignature,
  } = useWalletStore();

  const clearReviveError = useCallback(() => {
    setReviveError(null);
  }, []);

  const handleRevive = useCallback(async () => {
    console.log("[Revive] pressed");
    console.log("[Revive] publicKey from store:", publicKey);

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
      console.log("[Revive] calling transact()...");

      await transact(
        async (wallet: Web3MobileWallet) => {
          console.log(
            "[Revive] transact() opened — wallet callback running",
          );

          // 1. Authorize — let the wallet handle it entirely
          const authResult = await wallet.authorize({
            chain: "solana:devnet",
            identity: APP_IDENTITY,
          });
          console.log(
            "[Revive] authorized, accounts:",
            authResult.accounts.length,
          );

          const account = authResult.accounts[0];
          if (!account) {
            throw new Error("Wallet returned no accounts on authorize.");
          }
          console.log("[Revive] account address:", account.address);

          // Persist auth state so subsequent requests re-use it
          const userPublicKey = new PublicKey(
            Buffer.from(account.address, "base64"),
          );
          setAuthorizationState({
            publicKey: userPublicKey.toBase58(),
            authToken: authResult.auth_token,
            walletUriBase: authResult.wallet_uri_base ?? "",
            accountLabel: account.label ?? null,
          });

          // 2. Build the transaction
          const connection = new Connection(
            clusterApiUrl("devnet"),
            "confirmed",
          );
          const { blockhash } = await connection.getLatestBlockhash();
          console.log("[Revive] got blockhash:", blockhash);

          const transaction = new Transaction({
            recentBlockhash: blockhash,
            feePayer: userPublicKey,
          }).add(
            SystemProgram.transfer({
              fromPubkey: userPublicKey,
              toPubkey: new PublicKey(TREASURY_WALLET),
              lamports: REVIVE_COST_LAMPORTS,
            }),
          );

          // 3. Wallet signs + broadcasts — we never call sendRawTransaction
          console.log(
            "[Revive] calling wallet.signAndSendTransactions...",
          );
          const result = await wallet.signAndSendTransactions({
            transactions: [transaction],
          });
          console.log("[Revive] wallet returned signatures:", result);

          const sig = result[0];
          if (!sig) {
            throw new Error(
              "Wallet returned no signature. The transaction may not have been sent.",
            );
          }

          // Convert Uint8Array signature to base58 string if needed
          let signatureStr: string;
          if (typeof sig === "string") {
            signatureStr = sig;
          } else {
            // Import bs58 dynamically to encode raw bytes
            const bs58 = require("bs58");
            signatureStr = bs58.encode(sig);
          }
          console.log("[Revive] transaction signature:", signatureStr);

          // 4. Store the signature
          setLastTxSignature(signatureStr);

          // 5. Revive the tree in app state
          reviveTree();
        },
        walletUriBase ? { baseUri: walletUriBase } : undefined,
      );

      Alert.alert(
        "Tree Revived! 🌱",
        `Your tree is alive again! ${REVIVE_COST_SOL} SOL was sent to the treasury.`,
        [{ text: "Let's Grow! 🌳", style: "default" }],
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "An unknown error occurred.";
      console.error("[Revive] error:", message, err);

      if (
        message.toLowerCase().includes("cancel") ||
        message.toLowerCase().includes("rejected") ||
        message.toLowerCase().includes("declined")
      ) {
        setReviveError(
          "Transaction cancelled. Your tree is still waiting to be revived.",
        );
      } else if (
        message.toLowerCase().includes("not found") ||
        message.toLowerCase().includes("not installed")
      ) {
        setReviveError(
          "No compatible wallet found. Please install Phantom, Solflare, or Backpack and try again.",
        );
      } else if (
        message.toLowerCase().includes("insufficient") ||
        message.toLowerCase().includes("not enough")
      ) {
        setReviveError(
          `Not enough SOL. You need ${REVIVE_COST_SOL} SOL plus a small network fee to revive your tree.`,
        );
      } else {
        setReviveError(message);
        Alert.alert("Revive Debug Error", message);
      }
    } finally {
      setIsReviving(false);
    }
  }, [
    publicKey,
    walletUriBase,
    setAuthorizationState,
    setLastTxSignature,
    reviveTree,
  ]);

  return { handleRevive, isReviving, reviveError, clearReviveError };
}
