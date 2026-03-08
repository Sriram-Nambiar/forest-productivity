import {
  transact,
  type Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../src/constants';
import { getExplorerUrl } from '../src/solana/config';
import { getConnection } from '../src/solana/connection';
import {
  authorizeWalletSession,
  extractSignature,
  isLikelyUserRejection,
  isLikelyWalletMissing,
  normalizeErrorMessage,
} from '../src/solana/mobileWallet';
import {
  buildSendSOLTransaction,
  confirmTransaction,
} from '../src/solana/transactions';
import { useSettingsStore } from '../src/store/settingsStore';
import { useWalletStore } from '../src/store/walletStore';

/** Validate a Solana base58 address */
function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export default function SendScreen() {
  const darkMode = useSettingsStore((s) => s.darkMode);
  const {
    publicKey,
    cluster,
    authToken,
    setAuthorizationState,
    setLastTxSignature,
  } = useWalletStore();

  const [recipient, setRecipient] = useState('');
  const [amountText, setAmountText] = useState('');
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);

  const validate = useCallback((): string | null => {
    if (!publicKey) {
      return 'Wallet is not connected. Please connect your wallet first.';
    }

    const trimmedRecipient = recipient.trim();
    if (!trimmedRecipient) {
      return 'Please enter a recipient address.';
    }

    if (!isValidSolanaAddress(trimmedRecipient)) {
      return 'Invalid Solana address. Please check the recipient address.';
    }

    if (trimmedRecipient === publicKey) {
      return 'You cannot send SOL to your own address.';
    }

    const trimmedAmount = amountText.trim();
    if (!trimmedAmount) {
      return 'Please enter an amount.';
    }

    const amount = Number(trimmedAmount);
    if (!Number.isFinite(amount)) {
      return 'Amount must be a valid number.';
    }

    if (amount <= 0) {
      return 'Amount must be greater than 0.';
    }

    if (amount > 1000) {
      return 'Amount exceeds maximum of 1000 SOL per transaction.';
    }

    return null;
  }, [publicKey, recipient, amountText]);

  const ensureBalance = useCallback(
    async (payer: PublicKey, amountSol: number) => {
      const connection = getConnection(cluster);
      const lamports = await connection.getBalance(payer, 'confirmed');
      const requiredLamports = Math.round(amountSol * LAMPORTS_PER_SOL) + 10_000;
      if (lamports < requiredLamports) {
        throw new Error('Insufficient SOL balance for amount plus network fee.');
      }
    },
    [cluster],
  );

  const handleSend = useCallback(async () => {
    if (sendingRef.current) return;

    const error = validate();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    const trimmedRecipient = recipient.trim();
    const amount = Number(amountText.trim());

    sendingRef.current = true;
    setSending(true);

    try {
      const payerPubkey = new PublicKey(publicKey!);
      const recipientPubkey = new PublicKey(trimmedRecipient);
      await ensureBalance(payerPubkey, amount);

      const tx = await buildSendSOLTransaction(
        payerPubkey,
        recipientPubkey,
        amount,
        cluster,
      );

      const signatureResult = await transact(async (wallet: Web3MobileWallet) => {
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
      });

      const sig = extractSignature(signatureResult);

      setLastTxSignature(sig);
      const confirmed = await confirmTransaction(sig, cluster);

      const explorerUrl = getExplorerUrl(sig, cluster);
      const statusMsg = confirmed
        ? `Sent ${amount} SOL successfully!`
        : 'Transaction submitted (pending confirmation).';

      Alert.alert(
        confirmed ? 'Transaction Sent! 🎉' : 'Transaction Submitted',
        `${statusMsg}\n\nSignature: ${sig.slice(0, 20)}...`,
        [
          {
            text: 'View on Solscan',
            onPress: () => {
              Linking.openURL(explorerUrl).catch(() => {});
            },
          },
          {
            text: 'Done',
            onPress: () => {
              setRecipient('');
              setAmountText('');
              router.back();
            },
          },
        ],
      );
    } catch (err: unknown) {
      const message = normalizeErrorMessage(err);
      console.error('[SendSOL] Error:', message);

      if (message.toLowerCase().includes('insufficient')) {
        Alert.alert(
          'Insufficient Balance',
          'You do not have enough SOL for this transaction (amount + network fee).',
        );
      } else if (isLikelyUserRejection(message)) {
        Alert.alert(
          'Transaction Cancelled',
          'You cancelled the transaction in the wallet.',
        );
      } else if (isLikelyWalletMissing(message)) {
        Alert.alert(
          'Wallet Not Found',
          'Please install Phantom, Solflare, or Backpack wallet.',
        );
      } else {
        Alert.alert('Transaction Error', message);
      }
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }, [
    amountText,
    authToken,
    cluster,
    ensureBalance,
    publicKey,
    recipient,
    setAuthorizationState,
    setLastTxSignature,
    validate,
  ]);

  const shortKey = publicKey
    ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`
    : null;

  const canSend =
    !!publicKey &&
    recipient.trim().length > 0 &&
    amountText.trim().length > 0 &&
    !sending;

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, darkMode && styles.backTextDark]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, darkMode && styles.titleDark]}>Send SOL</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.networkBadge,
              cluster === 'mainnet-beta' && styles.networkBadgeMainnet,
            ]}
          >
            <View
              style={[
                styles.networkDot,
                cluster === 'mainnet-beta' && styles.networkDotMainnet,
              ]}
            />
            <Text style={styles.networkText}>
              {cluster === 'devnet' ? 'Devnet' : 'Mainnet'}
            </Text>
          </View>

          {publicKey ? (
            <View style={[styles.card, darkMode && styles.cardDark]}>
              <Text style={[styles.cardLabel, darkMode && styles.subtextDark]}>FROM</Text>
              <Text style={[styles.senderKey, darkMode && styles.textDark]}>
                {shortKey}
              </Text>
              <Text
                style={[styles.fullKey, darkMode && styles.subtextDark]}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {publicKey}
              </Text>
            </View>
          ) : (
            <View style={[styles.card, darkMode && styles.cardDark]}>
              <Text style={[styles.cardLabel, darkMode && styles.subtextDark]}>
                WALLET NOT CONNECTED
              </Text>
              <Text style={[styles.cardDescription, darkMode && styles.subtextDark]}>
                Go to the Wallet tab and connect your wallet before sending SOL.
              </Text>
            </View>
          )}

          <View style={[styles.card, darkMode && styles.cardDark]}>
            <Text style={[styles.cardLabel, darkMode && styles.subtextDark]}>TO</Text>
            <TextInput
              style={[styles.input, darkMode && styles.inputDark]}
              placeholder="Recipient Solana address"
              placeholderTextColor={
                darkMode ? COLORS.textSecondaryDark : COLORS.textSecondary
              }
              value={recipient}
              onChangeText={setRecipient}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!sending}
              selectTextOnFocus
            />
          </View>

          <View style={[styles.card, darkMode && styles.cardDark]}>
            <Text style={[styles.cardLabel, darkMode && styles.subtextDark]}>
              AMOUNT (SOL)
            </Text>
            <TextInput
              style={[styles.input, darkMode && styles.inputDark]}
              placeholder="0.00"
              placeholderTextColor={
                darkMode ? COLORS.textSecondaryDark : COLORS.textSecondary
              }
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="decimal-pad"
              editable={!sending}
              selectTextOnFocus
            />
            <Text style={[styles.feeNote, darkMode && styles.subtextDark]}>
              Network fee: ~0.000005 SOL
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, (!canSend || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!canSend || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.sendBtnText}>Send {amountText.trim() || '0'} SOL</Text>
            )}
          </TouchableOpacity>

          {cluster === 'mainnet-beta' && (
            <View style={styles.warningCard}>
              <Text style={styles.warningText}>
                ⚠️ You are on Mainnet. This transaction will use real SOL.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 64,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.solana,
  },
  backTextDark: {
    color: COLORS.solanaLight,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primaryDark,
    textAlign: 'center',
  },
  titleDark: {
    color: COLORS.primaryLight,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  networkBadgeMainnet: {
    backgroundColor: '#F3E5F5',
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 8,
  },
  networkDotMainnet: {
    backgroundColor: COLORS.solana,
  },
  networkText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
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
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  senderKey: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  fullKey: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  textDark: {
    color: COLORS.textDark,
  },
  subtextDark: {
    color: COLORS.textSecondaryDark,
  },
  input: {
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputDark: {
    color: COLORS.textDark,
    backgroundColor: COLORS.backgroundDark,
    borderColor: COLORS.borderDark,
  },
  feeNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  sendBtn: {
    backgroundColor: COLORS.solana,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 13,
    color: '#E65100',
    fontWeight: '600',
    textAlign: 'center',
  },
});