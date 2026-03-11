import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  REVIVE_COST_SOL,
  REWARD_AMOUNT_SOL,
  TREASURY_WALLET,
  type SolanaCluster,
} from "./config";
import { getConnection } from "./connection";

export interface TransactionResult {
  signature: string;
  cluster: SolanaCluster;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * Convert a SOL amount to lamports with validation.
 */
function solToLamports(amountSol: number): number {
  if (!Number.isFinite(amountSol) || amountSol <= 0) {
    throw new Error("Transfer amount must be a positive finite number.");
  }
  return Math.round(amountSol * LAMPORTS_PER_SOL);
}

/**
 * Pause execution for `ms` milliseconds.
 * Used between confirmation polling attempts.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Transaction builders ─────────────────────────────────────────────────────

/**
 * Build a SOL transfer transaction to the treasury wallet (reward tx).
 *
 * Always call this INSIDE a `transact()` callback after authorization so that
 * the blockhash is as fresh as possible when the wallet signs.
 */
export async function buildRewardTransaction(
  payerPublicKey: PublicKey,
  cluster: SolanaCluster,
): Promise<Transaction> {
  const connection = getConnection(cluster);
  const treasury = new PublicKey(TREASURY_WALLET);

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const transaction = new Transaction({
    blockhash,
    lastValidBlockHeight,
    feePayer: payerPublicKey,
  });

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: payerPublicKey,
      toPubkey: treasury,
      lamports: solToLamports(REWARD_AMOUNT_SOL),
    }),
  );

  return transaction;
}

/**
 * Build a SOL transfer transaction to the treasury wallet (revive tree tx).
 *
 * The user pays REVIVE_COST_SOL to bring their dead tree back to life.
 * The payment goes to the same treasury wallet used for reward transactions.
 *
 * Always call this INSIDE a `transact()` callback after authorization.
 */
export async function buildReviveTreeTransaction(
  payerPublicKey: PublicKey,
  cluster: SolanaCluster,
): Promise<Transaction> {
  const connection = getConnection(cluster);
  const treasury = new PublicKey(TREASURY_WALLET);

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const transaction = new Transaction({
    blockhash,
    lastValidBlockHeight,
    feePayer: payerPublicKey,
  });

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: payerPublicKey,
      toPubkey: treasury,
      lamports: solToLamports(REVIVE_COST_SOL),
    }),
  );

  return transaction;
}

/**
 * Build a SOL transfer transaction to an arbitrary recipient.
 *
 * Always call this INSIDE a `transact()` callback after authorization.
 */
export async function buildSendSOLTransaction(
  payerPublicKey: PublicKey,
  recipientPublicKey: PublicKey,
  amountSOL: number,
  cluster: SolanaCluster,
): Promise<Transaction> {
  const connection = getConnection(cluster);

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const transaction = new Transaction({
    blockhash,
    lastValidBlockHeight,
    feePayer: payerPublicKey,
  });

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: payerPublicKey,
      toPubkey: recipientPublicKey,
      lamports: solToLamports(amountSOL),
    }),
  );

  return transaction;
}

// ─── Confirmation ─────────────────────────────────────────────────────────────

/**
 * Number of polling rounds before giving up on confirmation.
 * 40 rounds × 2 s interval = 80 s maximum wait.
 */
const CONFIRM_MAX_RETRIES = 40;

/**
 * Milliseconds to wait between each `getSignatureStatuses` poll.
 */
const CONFIRM_RETRY_DELAY_MS = 2_000;

/**
 * Confirm a transaction on-chain using `getSignatureStatuses` polling.
 *
 * ### Why not `connection.confirmTransaction(signature, commitment)`?
 *
 * The legacy string-signature overload of `confirmTransaction` internally calls
 * `this.onSignature()`, which creates a **WebSocket subscription**. The
 * `Connection` in this app has `wsEndpoint: ""` (WebSocket intentionally
 * disabled on mobile to prevent "unable to connect to WebSocket server"
 * crashes). With no WebSocket available the subscription never fires, a single
 * HTTP status check is made immediately after setup (before any block has
 * processed the tx), and then the method idles for 30 s before throwing
 * `TransactionExpiredTimeoutError`.
 *
 * `getSignatureStatuses` is a plain HTTP JSON-RPC call — no WebSocket, no
 * subscriptions. It works correctly with `wsEndpoint: ""`.
 *
 * @returns `true`  – transaction was included in a block without error.
 * @returns `false` – transaction failed on-chain, expired, or timed out.
 */
export async function confirmTransaction(
  signature: string,
  cluster: SolanaCluster,
): Promise<boolean> {
  const connection = getConnection(cluster);

  for (let attempt = 0; attempt < CONFIRM_MAX_RETRIES; attempt++) {
    try {
      const { value } = await connection.getSignatureStatuses([signature], {
        // searchTransactionHistory ensures we find the tx even if the RPC node
        // has only just processed it and hasn't propagated it to its local cache
        // yet.  The minor extra latency is worth the reliability gain.
        searchTransactionHistory: true,
      });

      const status = value[0];

      if (status === null || status === undefined) {
        // Transaction not yet visible on this RPC node — keep polling.
        await sleep(CONFIRM_RETRY_DELAY_MS);
        continue;
      }

      if (status.err) {
        // Transaction was included in a block but the program returned an error
        // (e.g. insufficient lamports after fee deduction, invalid account).
        console.error(
          "[confirmTransaction] Transaction failed on-chain:",
          JSON.stringify(status.err),
        );
        return false;
      }

      // "confirmed" = super-majority of validators have processed the block.
      // "finalized" = the block is fully finalised (stronger guarantee).
      // Both are acceptable for our use-cases.
      if (
        status.confirmationStatus === "confirmed" ||
        status.confirmationStatus === "finalized"
      ) {
        return true;
      }

      // Status is "processed" (single validator) — not yet at "confirmed"
      // commitment level.  Keep polling.
      await sleep(CONFIRM_RETRY_DELAY_MS);
    } catch (error) {
      // Network hiccup — log, wait, then retry rather than aborting immediately.
      console.warn(
        `[confirmTransaction] Poll attempt ${attempt + 1}/${CONFIRM_MAX_RETRIES} error:`,
        error,
      );
      await sleep(CONFIRM_RETRY_DELAY_MS);
    }
  }

  // Exhausted all retries.  The transaction may still land but we can no longer
  // wait.  Callers should treat `false` as "uncertain" for this timeout case.
  console.warn(
    "[confirmTransaction] Timed out after",
    (CONFIRM_MAX_RETRIES * CONFIRM_RETRY_DELAY_MS) / 1000,
    "s waiting for signature:",
    signature,
  );
  return false;
}
