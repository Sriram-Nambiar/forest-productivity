import {
  transact,
  type Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useCallback, useMemo, useState } from "react";
import { getConnection } from "../solana/connection";
import {
  authorizeWalletSession,
  extractSignature,
  normalizeErrorMessage,
} from "../solana/mobileWallet";
import { buildSendSOLTransaction } from "../solana/transactions";
import { useWalletStore } from "../store/walletStore";

export function useWallet() {
  const {
    publicKey,
    cluster,
    authToken,
    walletUriBase,
    setAuthorizationState,
    disconnect,
    setLastTxSignature,
  } = useWalletStore();

  const [connecting, setConnecting] = useState(false);
  const [sending, setSending] = useState(false);
  const connection = useMemo(() => getConnection(cluster), [cluster]);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const authorization = await transact(
        async (wallet: Web3MobileWallet) => {
          return authorizeWalletSession(wallet, cluster, authToken);
        },
        walletUriBase ? { baseUri: walletUriBase } : undefined,
      );

      setAuthorizationState({
        publicKey: authorization.publicKey.toBase58(),
        authToken: authorization.authToken,
        walletUriBase: authorization.walletUriBase,
        accountLabel: authorization.accountLabel,
      });

      return authorization.publicKey;
    } finally {
      setConnecting(false);
    }
  }, [authToken, cluster, setAuthorizationState, walletUriBase]);

  const getBalance = useCallback(async () => {
    if (!publicKey) return 0;

    const balance = await connection.getBalance(
      new PublicKey(publicKey),
      "confirmed",
    );
    return balance / LAMPORTS_PER_SOL;
  }, [connection, publicKey]);

  const sendSOL = useCallback(
    async (toAddress: string, amountSOL: number) => {
      if (!publicKey) throw new Error("Wallet not connected");

      setSending(true);
      try {
        const recipient = new PublicKey(toAddress);

        const signatureResult = await transact(
          async (wallet: Web3MobileWallet) => {
            // ─── Authorize (or re-authorize) the wallet session ───────────
            const authorization = await authorizeWalletSession(
              wallet,
              cluster,
              authToken,
            );

            setAuthorizationState({
              publicKey: authorization.publicKey.toBase58(),
              authToken: authorization.authToken,
              walletUriBase: authorization.walletUriBase,
              accountLabel: authorization.accountLabel,
            });

            // ─── Build transaction INSIDE transact() ─────────────────────
            //
            // Building the transaction here — after authorization — guarantees
            // that the blockhash we embed is as fresh as possible.  If we
            // built it before calling transact() the wallet-open round-trip
            // (~2–10 s) plus any user deliberation time could push us close to
            // the ~60 s blockhash validity window, risking a "blockhash not
            // found" rejection from the cluster.
            const transaction = await buildSendSOLTransaction(
              authorization.publicKey, // use the authorised key, not the stored one
              recipient,
              amountSOL,
              cluster,
            );

            const signatures = await wallet.signAndSendTransactions({
              transactions: [transaction],
            });

            return signatures[0];
          },
          walletUriBase ? { baseUri: walletUriBase } : undefined,
        );

        const signature = extractSignature(signatureResult);
        setLastTxSignature(signature);
        return signature;
      } catch (error) {
        throw new Error(normalizeErrorMessage(error));
      } finally {
        setSending(false);
      }
    },
    [
      authToken,
      cluster,
      publicKey,
      setAuthorizationState,
      setLastTxSignature,
      walletUriBase,
    ],
  );

  return {
    publicKey: publicKey ? new PublicKey(publicKey) : null,
    connected: !!publicKey,
    connecting,
    sending,
    connect,
    disconnect,
    getBalance,
    sendSOL,
    connection,
  };
}
