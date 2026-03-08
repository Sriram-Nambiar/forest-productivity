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
        const payer = new PublicKey(publicKey);
        const recipient = new PublicKey(toAddress);
        const transaction = await buildSendSOLTransaction(
          payer,
          recipient,
          amountSOL,
          cluster,
        );

        const signatureResult = await transact(
          async (wallet: Web3MobileWallet) => {
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
