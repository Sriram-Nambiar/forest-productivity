import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  REWARD_AMOUNT_SOL,
  TREASURY_WALLET,
  type SolanaCluster,
} from "./config";
import { getConnection } from "./connection";

export interface TransactionResult {
  signature: string;
  cluster: SolanaCluster;
}

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
 * Build a SOL transfer transaction to the treasury wallet (reward tx).
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
 * Build a SOL transfer transaction to an arbitrary recipient.
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

/**
 * Confirm a transaction on-chain.
 * Returns `true` if confirmed without error, `false` otherwise.
 */
export async function confirmTransaction(
  signature: string,
  cluster: SolanaCluster,
): Promise<boolean> {
  const connection = getConnection(cluster);
  try {
    const result = await connection.confirmTransaction(signature, "confirmed");
    return !result.value.err;
  } catch (error) {
    console.error("[confirmTransaction] Error:", error);
    return false;
  }
}
