import {
  transact,
  type Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  authorizeWalletSession,
  extractSignature,
  isLikelyInsufficientFunds,
  isLikelyRpcFailure,
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
  const [balance, setBalance] = useState<number | null>(null);
  const txInProgressRef = useRef(false);

  // ─── Connect Wallet ───
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
  }, [authToken, cluster, connecting, setAuthorizationState, setConnecting, walletUriBase]);

  // ─── Disconnect Wallet ───
  const handleDisconnect = useCallback(() => {
    Alert.alert('Disconnect Wallet', 'Are you sure you want to disconnect?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: () => {
          disconnect();
          setBalance(null);
        },
      },
    ]);
  }, [disconnect]);

  // ─── Balance Check ───
  const ensureSolBalance = useCallback(
    async (payer: PublicKey, estimatedSpendLamports: number): Promise<void> => {
      const connection = getConnection(cluster);
      const bal = await connection.getBalance(payer);
      if (bal < estimatedSpendLamports + 5000) {
        throw new Error(
          `Insufficient SOL balance. You have ${(bal / LAMPORTS_PER_SOL).toFixed(6)} SOL but need at least ${((estimatedSpendLamports + 5000) / LAMPORTS_PER_SOL).toFixed(6)} SOL (including fees).`,
        );
      }
    },
    [cluster],
  );

  // ─── Refresh Balance ───
  const refreshBalance = useCallback(async () => {
    if (!publicKey) return;
    try {
      const connection = getConnection(cluster);
      const bal = await connection.getBalance(new PublicKey(publicKey));
      setBalance(bal / LAMPORTS_PER_SOL);
    } catch {
      setBalance(null);
    }
  }, [publicKey, cluster]);

  // Auto-refresh balance when a new transaction signature appears (covers revive, reward, etc.)
  useEffect(() => {
    if (lastTxSignature && publicKey) {
      // Small delay to let the transaction confirm on-chain
      const timer = setTimeout(() => refreshBalance(), 2_000);
      return () => clearTimeout(timer);
    }
  }, [lastTxSignature, publicKey, refreshBalance]);

  // ─── Send Reward Transaction ───
  const handleSendReward = useCallback(async () => {
    if (!publicKey || txInProgressRef.current) return;

    // Rate limit check
    const now = Date.now();
    if (now - lastRewardTimestamp < REWARD_COOLDOWN_MS) {
      const remaining = Math.ceil((REWARD_COOLDOWN_MS - (now - lastRewardTimestamp)) / 1000);
      Alert.alert('Please Wait', `You can send another reward in ${remaining}s.`);
      return;
    }

    txInProgressRef.current = true;
    setTxLoading(true);

    try {
      const payerPk = new PublicKey(publicKey);
      const rewardLamports = Math.round(REWARD_AMOUNT_SOL * LAMPORTS_PER_SOL);

      await ensureSolBalance(payerPk, rewardLamports);

      const signatureStr = await transact(
        async (wallet: Web3MobileWallet) => {
          const auth = await authorizeWalletSession(wallet, cluster, authToken);

          setAuthorizationState({
            publicKey: auth.publicKey.toBase58(),
            authToken: auth.authToken,
            walletUriBase: auth.walletUriBase,
            accountLabel: auth.accountLabel,
          });

          const tx = await buildRewardTransaction(auth.publicKey, cluster);
          const signatures = await wallet.signAndSendTransactions({
            transactions: [tx],
          });

          const sig = signatures[0];
          if (!sig) throw new Error('Wallet returned no signature.');
          return extractSignature(sig);
        },
        walletUriBase ? { baseUri: walletUriBase } : undefined,
      );

      setLastTxSignature(signatureStr);
      setLastRewardTimestamp(Date.now());

      const confirmed = await confirmTransaction(signatureStr, cluster);

      if (confirmed) {
        Alert.alert('Reward Sent! 🎉', `${REWARD_AMOUNT_SOL} SOL sent to treasury.`);
      } else {
        Alert.alert('Transaction Pending', 'Transaction sent but confirmation timed out. It may still succeed.');
      }

      refreshBalance();
    } catch (error: unknown) {
      const message = normalizeErrorMessage(error);
      console.error('[Reward TX] Error:', message);

      if (isLikelyUserRejection(message)) {
        Alert.alert('Transaction Cancelled', 'You cancelled the transaction.');
      } else if (isLikelyInsufficientFunds(message)) {
        Alert.alert('Insufficient SOL', message);
      } else if (isLikelyRpcFailure(message)) {
        Alert.alert('Network Error', 'Could not reach Solana devnet. Please try again.');
      } else {
        Alert.alert('Transaction Failed', message);
      }
    } finally {
      txInProgressRef.current = false;
      setTxLoading(false);
    }
  }, [
    publicKey,
    authToken,
    cluster,
    lastRewardTimestamp,
    walletUriBase,
    setAuthorizationState,
    setLastTxSignature,
    setLastRewardTimestamp,
    ensureSolBalance,
    refreshBalance,
  ]);

  // ─── Open Explorer ───
  const handleOpenExplorer = useCallback(() => {
    if (!lastTxSignature) return;
    const url = getExplorerUrl(lastTxSignature, cluster);
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Could not open browser.'),
    );
  }, [lastTxSignature, cluster]);

  // ─── Shorten public key for display ───
  const shortenedKey = publicKey
    ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`
    : null;

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, darkMode && styles.titleDark]}>Wallet</Text>

        {/* Network Badge */}
        <View style={styles.networkBadge}>
          <View style={styles.networkDot} />
          <Text style={styles.networkText}>Devnet</Text>
        </View>

        {!publicKey ? (
          /* ─── Not Connected ─── */
          <View style={styles.centerSection}>
            <Text style={styles.walletEmoji}>🔗</Text>
            <Text style={[styles.subtitle, darkMode && styles.subtextDark]}>
              Connect a Solana wallet to send transactions and mint NFTs.
            </Text>
            <TouchableOpacity
              style={styles.connectBtn}
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
          </View>
        ) : (
          /* ─── Connected ─── */
          <>
            {/* Wallet Info Card */}
            <View style={[styles.card, darkMode && styles.cardDark]}>
              <Text style={[styles.cardLabel, darkMode && styles.subtextDark]}>
                CONNECTED WALLET
              </Text>
              {accountLabel && (
                <Text style={[styles.accountLabel, darkMode && styles.textDark]}>
                  {accountLabel}
                </Text>
              )}
              <Text style={[styles.publicKeyText, darkMode && styles.textDark]}>
                {shortenedKey}
              </Text>
              {balance !== null && (
                <Text style={[styles.balanceText, darkMode && styles.subtextDark]}>
                  Balance: {balance.toFixed(4)} SOL
                </Text>
              )}
              <View style={styles.walletActions}>
                <TouchableOpacity
                  style={styles.refreshBtn}
                  onPress={refreshBalance}
                >
                  <Text style={styles.refreshBtnText}>Refresh Balance</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.disconnectBtn}
                  onPress={handleDisconnect}
                >
                  <Text style={styles.disconnectBtnText}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Actions */}
            <View style={[styles.card, darkMode && styles.cardDark]}>
              <Text style={[styles.cardLabel, darkMode && styles.subtextDark]}>
                ACTIONS
              </Text>

              {/* Reward Button */}
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
                    Send {REWARD_AMOUNT_SOL} SOL Reward 🎁
                  </Text>
                )}
              </TouchableOpacity>

              {/* Send SOL */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSecondary]}
                onPress={() => router.push('/send')}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionBtnText, styles.actionBtnSecondaryText]}>
                  Send SOL ↗
                </Text>
              </TouchableOpacity>
            </View>

            {/* Last Transaction */}
            {lastTxSignature && (
              <View style={[styles.card, darkMode && styles.cardDark]}>
                <Text style={[styles.cardLabel, darkMode && styles.subtextDark]}>
                  LAST TRANSACTION
                </Text>
                <Text
                  style={[styles.signatureText, darkMode && styles.textDark]}
                  numberOfLines={1}
                >
                  {lastTxSignature.slice(0, 20)}...
                </Text>
                <TouchableOpacity onPress={handleOpenExplorer}>
                  <Text style={styles.explorerLink}>View on Solscan ↗</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  containerDark: {
    backgroundColor: COLORS.backgroundDark,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primaryDark,
    paddingVertical: 16,
  },
  titleDark: {
    color: COLORS.primaryLight,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 8,
  },
  networkText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  centerSection: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  walletEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  subtextDark: {
    color: COLORS.textSecondaryDark,
  },
  connectBtn: {
    backgroundColor: COLORS.solana,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    minWidth: 200,
    alignItems: 'center',
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardDark: {
    backgroundColor: COLORS.surfaceDark,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  textDark: {
    color: COLORS.textDark,
  },
  accountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  publicKeyText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'monospace',
  },
  balanceText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  refreshBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  disconnectBtn: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disconnectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtn: {
    backgroundColor: COLORS.solana,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.solana,
  },
  actionBtnSecondaryText: {
    color: COLORS.solana,
  },
  signatureText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: COLORS.text,
    marginBottom: 8,
  },
  explorerLink: {
    color: COLORS.solana,
    fontSize: 14,
    fontWeight: '600',
  },
});