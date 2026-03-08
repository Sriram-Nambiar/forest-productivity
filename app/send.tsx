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
  isLikelyInsufficientFunds,
  isLikelyRpcFailure,
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
    walletUriBase,
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

  const canSend =
    !!publicKey &&
    recipient.trim().length > 0 &&
    amountText.trim().length > 0 &&
    !sending;

  const handleSend = useCallback(async () => {
    if (sendingRef.current) return;

    const error = validate();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    sendingRef.current = true;
    setSending(true);

    try {
      const payerPk = new PublicKey(publicKey!);
      const recipientPk = new PublicKey(recipient.trim());
      const amount = Number(amountText.trim());

      // Balance check
      const connection = getConnection(cluster);
      const balance = await connection.getBalance(payerPk);
      const spendLamports = Math.round(amount * LAMPORTS_PER_SOL) + 5000;
      if (balance < spendLamports) {
        Alert.alert(
          'Insufficient SOL',
          `You have ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL but need ${(spendLamports / LAMPORTS_PER_SOL).toFixed(6)} SOL.`,
        );
        return;
      }

      const signatureStr = await transact(
        async (wallet: Web3MobileWallet) => {
          const auth = await authorizeWalletSession(wallet, cluster, authToken);

          setAuthorizationState({
            publicKey: auth.publicKey.toBase58(),
            authToken: auth.authToken,
            walletUriBase: auth.walletUriBase,
            accountLabel: auth.accountLabel,
          });

          const tx = await buildSendSOLTransaction(
            auth.publicKey,
            recipientPk,
            amount,
            cluster,
          );

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

      const confirmed = await confirmTransaction(signatureStr, cluster);

      if (confirmed) {
        Alert.alert(
          'Transaction Sent! 🎉',
          `Successfully sent ${amount} SOL.`,
          [
            {
              text: 'View on Solscan',
              onPress: () =>
                Linking.openURL(getExplorerUrl(signatureStr, cluster)),
            },
            { text: 'Done', onPress: () => router.back() },
          ],
        );
      } else {
        Alert.alert(
          'Transaction Pending',
          'Transaction sent but confirmation timed out. It may still succeed.',
          [{ text: 'OK', onPress: () => router.back() }],
        );
      }
    } catch (err: unknown) {
      const message = normalizeErrorMessage(err);
      console.error('[Send SOL] Error:', message);

      if (isLikelyUserRejection(message)) {
        Alert.alert('Cancelled', 'You cancelled the transaction.');
      } else if (isLikelyWalletMissing(message)) {
        Alert.alert('Wallet Not Found', 'No compatible wallet app detected.');
      } else if (isLikelyInsufficientFunds(message)) {
        Alert.alert('Insufficient SOL', message);
      } else if (isLikelyRpcFailure(message)) {
        Alert.alert('Network Error', 'Could not reach Solana devnet. Please try again.');
      } else {
        Alert.alert('Transaction Failed', message);
      }
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }, [
    validate,
    publicKey,
    recipient,
    amountText,
    cluster,
    authToken,
    walletUriBase,
    setAuthorizationState,
    setLastTxSignature,
  ]);

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={[styles.backText, darkMode && styles.backTextDark]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, darkMode && styles.titleDark]}>Send SOL</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Network Badge */}
          <View style={styles.networkBadge}>
            <View style={styles.networkDot} />
            <Text style={styles.networkText}>Devnet</Text>
          </View>

          {/* Sender Info */}
          <View style={[styles.card, darkMode && styles.cardDark]}>
            <Text style={[styles.cardLabel, darkMode && styles.subtextDark]}>FROM</Text>
            <Text style={[styles.senderKey, darkMode && styles.textDark]} numberOfLines={1}>
              {publicKey
                ? `${publicKey.slice(0, 8)}...${publicKey.slice(-4)}`
                : 'Not connected'}
            </Text>
          </View>

          {/* Recipient */}
          <View style={[styles.card, darkMode && styles.cardDark]}>
            <Text style={[styles.cardLabel, darkMode && styles.subtextDark]}>
              RECIPIENT ADDRESS
            </Text>
            <TextInput
              style={[styles.input, darkMode && styles.inputDark]}
              placeholder="Enter Solana address..."
              placeholderTextColor={darkMode ? COLORS.textSecondaryDark : COLORS.textSecondary}
              value={recipient}
              onChangeText={setRecipient}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!sending}
            />
          </View>

          {/* Amount */}
          <View style={[styles.card, darkMode && styles.cardDark]}>
            <Text style={[styles.cardLabel, darkMode && styles.subtextDark]}>
              AMOUNT (SOL)
            </Text>
            <TextInput
              style={[styles.input, darkMode && styles.inputDark]}
              placeholder="0.00"
              placeholderTextColor={darkMode ? COLORS.textSecondaryDark : COLORS.textSecondary}
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

          {/* Send Button */}
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
  subtextDark: {
    color: COLORS.textSecondaryDark,
  },
  textDark: {
    color: COLORS.textDark,
  },
  senderKey: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'monospace',
  },
  input: {
    fontSize: 16,
    color: COLORS.text,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
  },
  inputDark: {
    color: COLORS.textDark,
    borderBottomColor: COLORS.borderDark,
  },
  feeNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  sendBtn: {
    backgroundColor: COLORS.solana,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 8,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});