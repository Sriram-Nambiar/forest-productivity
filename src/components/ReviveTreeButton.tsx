import React, { memo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants';
import { useReviveTree } from '../hooks/useReviveTree';
import { REVIVE_COST_SOL } from '../solana/config';
import { useWalletStore } from '../store/walletStore';

interface ReviveTreeButtonProps {
  darkMode: boolean;
}

const ReviveTreeButton = memo(function ReviveTreeButton({
  darkMode,
}: ReviveTreeButtonProps) {
  const { handleRevive, isReviving, reviveError, clearReviveError } =
    useReviveTree();

  const connected = useWalletStore((s) => !!s.publicKey);

  return (
    <View style={styles.wrapper}>
      {/* ── Divider label ── */}
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, darkMode && styles.dividerLineDark]} />
        <Text style={[styles.dividerLabel, darkMode && styles.dividerLabelDark]}>
          or
        </Text>
        <View style={[styles.dividerLine, darkMode && styles.dividerLineDark]} />
      </View>

      {/* ── Revive button ── */}
      <TouchableOpacity
        style={[
          styles.reviveButton,
          isReviving && styles.reviveButtonLoading,
          !connected && styles.reviveButtonMuted,
        ]}
        onPress={handleRevive}
        disabled={isReviving}
        activeOpacity={0.8}
        accessibilityLabel={`Revive tree for ${REVIVE_COST_SOL} SOL`}
        accessibilityRole="button"
        accessibilityState={{ disabled: isReviving, busy: isReviving }}
      >
        {isReviving ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={styles.reviveButtonText}>Processing…</Text>
          </View>
        ) : (
          <Text style={styles.reviveButtonText}>
            {`Revive Tree 🌱  (${REVIVE_COST_SOL} SOL)`}
          </Text>
        )}
      </TouchableOpacity>

      {/* ── Wallet hint (shown only when no wallet is connected) ── */}
      {!connected && !isReviving && (
        <Text style={[styles.hintText, darkMode && styles.hintTextDark]}>
          Connect a wallet in the Wallet tab to pay for revival
        </Text>
      )}

      {/* ── Dismissible error message ── */}
      {reviveError !== null && (
        <TouchableOpacity
          style={styles.errorContainer}
          onPress={clearReviveError}
          activeOpacity={0.7}
          accessibilityLabel="Dismiss error message"
          accessibilityRole="button"
        >
          <Text style={styles.errorIcon}>⚠️</Text>
          <View style={styles.errorTextBlock}>
            <Text style={styles.errorText}>{reviveError}</Text>
            <Text style={styles.errorDismiss}>Tap to dismiss</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '70%',
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerLineDark: {
    backgroundColor: COLORS.borderDark,
  },
  dividerLabel: {
    marginHorizontal: 10,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  dividerLabelDark: {
    color: COLORS.textSecondaryDark,
  },

  // ── Revive button ──
  reviveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 15,
    borderRadius: 28,
    minWidth: 260,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  reviveButtonLoading: {
    opacity: 0.7,
  },
  reviveButtonMuted: {
    backgroundColor: COLORS.primaryDark,
    opacity: 0.75,
  },
  reviveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // ── Wallet hint ──
  hintText: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  hintTextDark: {
    color: COLORS.textSecondaryDark,
  },

  // ── Error banner ──
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 300,
    gap: 8,
  },
  errorIcon: {
    fontSize: 16,
    lineHeight: 20,
  },
  errorTextBlock: {
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    lineHeight: 18,
    fontWeight: '500',
  },
  errorDismiss: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});

export { ReviveTreeButton };
