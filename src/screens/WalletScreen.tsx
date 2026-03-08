import {
  transact,
  type Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import {
  getExplorerUrl,
  REWARD_AMOUNT_SOL,
  REWARD_COOLDOWN_MS,
} from '../solana/config';
import { getConnection } from '../solana/connection';
import {
  APP_IDENTITY,
  authorizeWalletSession,
  extractSignature,
  isLikelyUserRejection,
  isLikelyWalletMissing,
  normalizeErrorMessage,
} from '../solana/mobileWallet';
import {
  buildRewardTransaction,
  confirmTransaction,
} from '../solana/transactions';
import { useSettingsStore } from '../store/settingsStore';
import { useWalletStore } from '../store/walletStore';

export default function WalletScreen() {
  const darkMode = useSettingsStore((s) => s.darkMode);
  const {
    publicKey,
    authToken,
    cluster,
    connecting,
    lastTxSignature,
    lastRewardTimestamp,
    accountLabel,
    setConnecting,
    setLastTxSignature,
    setLastRewardTimestamp,
    setAuthorizationState,
    disconnect,
    walletUriBase,
  } = useWalletStore();

  const [txLoading, setTxLoading] = useState(false);
  const txInProgressRef = useRef(false);

  const handleConnect = useCallback(async () => {
    if (connecting) return;

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
    } catch (error: unknown) {
      const message = normalizeErrorMessage(error);
      console.error('[Wallet Connect] Error:', message);

      if (isLikelyUserRejection(message)) {
        Alert.alert('Connection Cancelled', 'You cancelled wallet authorization.');
      } else if (isLikelyWalletMissing(message)) {
        Alert.alert(
          'Wallet Not Found',
          'Please install a Solana wallet app (Phantom, Solflare, or Backpack) and try again.',
        );
      } else {
        Alert.alert('Connection Error', `Failed to connect wallet: ${message}`);
      }
    } finally {
      setConnecting(false);
    }
  }, [
    authToken,
    cluster,
    connecting,
    setAuthorizationState,
    setConnecting,
    walletUriBase,
  ]);

  const handleDisconnect = useCallback(() => {
    Alert.alert('Disconnect Wallet', 'Are you sure you want to disconnect?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: () => disconnect(),
      },
    ]);
  }, [disconnect]);

  const ensureSolBalance = useCallback(
    async (payer: PublicKey, estimatedSpendLamports: number): Promise<void> => {
      const connection = getConnection(cluster);
      const currentLamports = await connection.getBalance(payer, 'confirmed');
      const safetyBuffer = 10_000;
      if (currentLamports < estimatedSpendLamports + safetyBuffer) {
        throw new Error('Insufficient SOL balance for amount plus network fee.');
      }
    },
    [cluster],
  );

  const executeWalletTransaction = useCallback(
    async (
      txBuilder: (payer: PublicKey) => Promise<Transaction>,
      opts?: { requireBalanceLamports?: number },
    ): Promise<string> => {
      if (!publicKey) {
        throw new Error('Wallet not connected.');
      }

      const payerPubkey = new PublicKey(publicKey);
      if (opts?.requireBalanceLamports) {
        await ensureSolBalance(payerPubkey, opts.requireBalanceLamports);
      }

      const tx = await txBuilder(payerPubkey);

      const signatureResult = await transact(
        async (wallet: Web3MobileWallet) => {
          const authorization = await authorizeWalletSession(wallet, cluster, authToken);

          setAuthorizationState({
            publicKey: authorization.publicKey.toBase58(),
            authToken: authorization.authToken,
            walletUriBase: authorization.walletUriBase,
            accountLabel: authorization.accountLabel,
          });

          const signatures = await wallet.signAndSendTransactions({
            transactions: [tx],
          });
          return signatures[0];
        },
        walletUriBase ? { baseUri: walletUriBase } : undefined,
      );

      const signature = extractSignature(signatureResult);
      setLastTxSignature(signature);
      return signature;
    },
    [
      authToken,
      cluster,
      ensureSolBalance,
      publicKey,
      setAuthorizationState,
      setLastTxSignature,
      walletUriBase,
    ],
  );

  const handleSendReward = useCallback(async () => {
    if (!publicKey || txInProgressRef.current) return;

    const now = Date.now();
    if (now - lastRewardTimestamp < REWARD_COOLDOWN_MS) {
      const waitSec = Math.ceil(
        (REWARD_COOLDOWN_MS - (now - lastRewardTimestamp)) / 1000,
      );
      Alert.alert('Please Wait', `You can send another reward in ${waitSec} seconds.`);
      return;
    }

    txInProgressRef.current = true;
    setTxLoading(true);

    try {
      const sig = await executeWalletTransaction(
        (payer) => buildRewardTransaction(payer, cluster),
        { requireBalanceLamports: Math.round(REWARD_AMOUNT_SOL * LAMPORTS_PER_SOL) },
      );

      setLastRewardTimestamp(Date.now());

      const confirmed = await confirmTransaction(sig, cluster);
      if (confirmed) {
        Alert.alert(
          'Reward Sent! 🎉',
          `Sent ${REWARD_AMOUNT_SOL} SOL to treasury.\nSignature: ${sig.slice(0, 16)}...`,
        );
      } else {
        Alert.alert('Pending', 'Transaction submitted but not yet confirmed.');
      }
    } catch (error: unknown) {
      const message = normalizeErrorMessage(error);
      console.error('[Send Reward] Error:', message);

      if (message.toLowerCase().includes('insufficient')) {
        Alert.alert(
          'Insufficient Balance',
          'You do not have enough SOL for this transaction (including network fee).',
        );
      } else if (isLikelyUserRejection(message)) {
        Alert.alert('Transaction Cancelled', 'You cancelled the transaction.');
      } else if (isLikelyWalletMissing(message)) {
        Alert.alert('Wallet Not Found', 'No compatible Solana wallet app is installed.');
      } else {
        Alert.alert('Transaction Error', message);
      }
    } finally {
      txInProgressRef.current = false;
      setTxLoading(false);
    }
  }, [
    cluster,
    executeWalletTransaction,
    lastRewardTimestamp,
    publicKey,
    setLastRewardTimestamp,
  ]);

  const handleViewTx = useCallback(() => {
    if (!lastTxSignature) return;
    const url = getExplorerUrl(lastTxSignature, cluster);
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open browser.');
    });
  }, [lastTxSignature, cluster]);

  const shortKey = publicKey
    ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`
    : null;

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, darkMode && styles.titleDark]}>Wallet</Text>

        <View style={styles.networkBadge}>
          <View style={styles.networkDot} />
          <Text style={styles.networkText}>Devnet</Text>
        </View>

        <View style={[styles.card, darkMode && styles.cardDark]}>
          {publicKey ? (
            <>
              <Text style={[styles.cardLabel, darkMode && styles.subtextDark]}>
                CONNECTED
              </Text>
              <Text style={[styles.publicKey, darkMode && styles.textDark]}>{shortKey}</Text>
              <Text
                style={[styles.fullKey, darkMode && styles.subtextDark]}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {publicKey}
              </Text>
              {!!accountLabel && (
                <Text style={[styles.walletLabel, darkMode && styles.subtextDark]}>
                  Wallet: {accountLabel}
                </Text>
              )}
              <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
                <Text style={styles.disconnectText}>Disconnect</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.cardLabel, darkMode && styles.subtextDark]}>
                NOT CONNECTED
              </Text>
              <Text style={[styles.cardDescription, darkMode && styles.subtextDark]}>
                Connect a Solana wallet to send rewards and test transfers on devnet.
              </Text>
              <TouchableOpacity
                style={[styles.connectBtn, connecting && styles.connectBtnDisabled]}
                onPress={handleConnect}
                disabled={connecting}
                activeOpacity={0.8}
              >
                {connecting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.connectBtnText}>Connect Wallet</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {publicKey && (
          <View style={[styles.card, darkMode && styles.cardDark]}>
            <Text style={[styles.cardLabel, darkMode && styles.subtextDark]}>
              ACTIONS
            </Text>

            <TouchableOpacity
              style={[styles.actionBtn, txLoading && styles.actionBtnDisabled]}
              onPress={handleSendReward}
              disabled={txLoading}
              activeOpacity={0.8}
            >
              {txLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.actionBtnText}>
                  Send {REWARD_AMOUNT_SOL} SOL Reward 🌳
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.sendSolBtn, txLoading && styles.actionBtnDisabled]}
              onPress={() => router.push('/send' as never)}
              disabled={txLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>Send SOL 💸</Text>
            </TouchableOpacity>
          </View>
        )}

        {lastTxSignature && (
          <View style={[styles.card, darkMode && styles.cardDark]}>
            <Text style={[styles.cardLabel, darkMode && styles.subtextDark]}>
              LAST TRANSACTION
            </Text>
            <Text
              style={[styles.txSig, darkMode && styles.textDark]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {lastTxSignature}
            </Text>
            <TouchableOpacity style={styles.viewTxBtn} onPress={handleViewTx}>
              <Text style={styles.viewTxText}>View on Solscan ↗</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={[styles.footerText, darkMode && styles.subtextDark]}>
            {APP_IDENTITY.name} – Solana Devnet
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  containerDark: { backgroundColor: COLORS.backgroundDark },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.primaryDark, paddingVertical: 16 },
  titleDark: { color: COLORS.primaryLight },
  networkBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 16 },
  networkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success, marginRight: 8 },
  networkText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  cardDark: { backgroundColor: COLORS.surfaceDark },
  cardLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 8 },
  cardDescription: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 16 },
  publicKey: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  fullKey: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },
  walletLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },
  textDark: { color: COLORS.textDark },
  subtextDark: { color: COLORS.textSecondaryDark },
  connectBtn: { backgroundColor: COLORS.solana, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  connectBtnDisabled: { opacity: 0.6 },
  connectBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  disconnectBtn: { borderWidth: 1, borderColor: COLORS.error, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  disconnectText: { color: COLORS.error, fontSize: 14, fontWeight: '600' },
  actionBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
  sendSolBtn: { backgroundColor: '#FF6F00' },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  txSig: { fontSize: 13, fontFamily: 'monospace', color: COLORS.text, marginBottom: 8 },
  viewTxBtn: { alignSelf: 'flex-start' },
  viewTxText: { fontSize: 14, fontWeight: '600', color: COLORS.solana },
  footer: { alignItems: 'center', marginTop: 32 },
  footerText: { fontSize: 12, color: COLORS.textSecondary },
});