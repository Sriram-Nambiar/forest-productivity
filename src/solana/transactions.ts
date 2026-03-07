import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  REWARD_AMOUNT_SOL,
  TREASURY_WALLET,
  type SolanaCluster,
} from "./config";
import { getConnection } from "./connection";

/** Solana Memo Program ID */
const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);

export interface TransactionResult {
  signature: string;
  cluster: SolanaCluster;
}

/**
 * Build a SOL transfer transaction to the treasury wallet.
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
      lamports: Math.round(REWARD_AMOUNT_SOL * LAMPORTS_PER_SOL),
    }),
  );

  return transaction;
}

/**
 * Build a memo transaction to record focus session proof on-chain.
 */
export async function buildMemoTransaction(
  payerPublicKey: PublicKey,
  cluster: SolanaCluster,
  durationMinutes: number,
): Promise<Transaction> {
  const connection = getConnection(cluster);

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const memo = `Focus session completed: ${durationMinutes} minutes`;
  const memoBuffer = Buffer.from(memo, "utf-8");

  const transaction = new Transaction({
    blockhash,
    lastValidBlockHeight,
    feePayer: payerPublicKey,
  });

  transaction.add(
    new TransactionInstruction({
      keys: [{ pubkey: payerPublicKey, isSigner: true, isWritable: true }],
      programId: MEMO_PROGRAM_ID,
      data: memoBuffer,
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
      lamports: Math.round(amountSOL * LAMPORTS_PER_SOL),
    }),
  );

  return transaction;
}

/**
 * Confirm a transaction and return whether it succeeded.
 */
export async function confirmTransaction(
  signature: string,
  cluster: SolanaCluster,
): Promise<boolean> {
  const connection = getConnection(cluster);
  try {
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");
    const result = await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed",
    );
    return !result.value.err;
  } catch (error) {
    console.error("[confirmTransaction] Error:", error);
    return false;
  }
}
