import React, { memo, useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, DURATION_OPTIONS } from '../constants';
import { validateDuration } from '../utils/helpers';

interface DurationSelectorProps {
  selectedDuration: number;
  onSelect: (minutes: number) => void;
  disabled: boolean;
  darkMode: boolean;
}

const DurationSelector = memo(function DurationSelector({
  selectedDuration,
  onSelect,
  disabled,
  darkMode,
}: DurationSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [customValue, setCustomValue] = useState(String(selectedDuration));

  const handleCustom = useCallback(() => {
    if (Platform.OS === 'ios') {
      // iOS supports Alert.prompt
      Alert.prompt(
        'Custom Duration',
        'Enter duration in minutes (1-120)',
        (text) => {
          const value = parseInt(text, 10);
          if (validateDuration(value)) {
            onSelect(value);
          } else {
            Alert.alert('Invalid Duration', 'Please enter a number between 1 and 120.');
          }
        },
        'plain-text',
        String(selectedDuration),
        'number-pad',
      );
    } else {
      // Android: use a modal with TextInput
      setCustomValue(String(selectedDuration));
      setModalVisible(true);
    }
  }, [onSelect, selectedDuration]);

  const handleModalConfirm = useCallback(() => {
    const value = parseInt(customValue, 10);
    if (validateDuration(value)) {
      onSelect(value);
      setModalVisible(false);
    } else {
      Alert.alert('Invalid Duration', 'Please enter a number between 1 and 120.');
    }
  }, [customValue, onSelect]);

  const handleModalCancel = useCallback(() => {
    setModalVisible(false);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, darkMode && styles.labelDark]}>Duration</Text>
      <View style={styles.options}>
        {DURATION_OPTIONS.map((minutes) => (
          <TouchableOpacity
            key={minutes}
            style={[
              styles.option,
              darkMode && styles.optionDark,
              selectedDuration === minutes && styles.optionSelected,
              disabled && styles.optionDisabled,
            ]}
            onPress={() => onSelect(minutes)}
            disabled={disabled}
          >
            <Text
              style={[
                styles.optionText,
                darkMode && styles.optionTextDark,
                selectedDuration === minutes && styles.optionTextSelected,
              ]}
            >
              {minutes}m
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            styles.option,
            darkMode && styles.optionDark,
            !DURATION_OPTIONS.includes(selectedDuration as typeof DURATION_OPTIONS[number]) && styles.optionSelected,
            disabled && styles.optionDisabled,
          ]}
          onPress={handleCustom}
          disabled={disabled}
        >
          <Text
            style={[
              styles.optionText,
              darkMode && styles.optionTextDark,
              !DURATION_OPTIONS.includes(selectedDuration as typeof DURATION_OPTIONS[number]) && styles.optionTextSelected,
            ]}
          >
            {DURATION_OPTIONS.includes(selectedDuration as typeof DURATION_OPTIONS[number]) ? 'Custom' : `${selectedDuration}m`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Duration Modal (Android) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleModalCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, darkMode && styles.modalTitleDark]}>
              Custom Duration
            </Text>
            <Text style={[styles.modalSubtitle, darkMode && styles.modalSubtitleDark]}>
              Enter duration in minutes (1-120)
            </Text>
            <TextInput
              style={[styles.modalInput, darkMode && styles.modalInputDark]}
              value={customValue}
              onChangeText={(text) => setCustomValue(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              autoFocus
              selectTextOnFocus
              maxLength={3}
              placeholderTextColor={darkMode ? '#666' : '#999'}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={handleModalCancel}>
                <Text style={[styles.modalCancelText, darkMode && styles.modalCancelTextDark]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleModalConfirm}>
                <Text style={styles.modalConfirmText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  labelDark: {
    color: COLORS.textSecondaryDark,
  },
  options: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionDark: {
    backgroundColor: COLORS.surfaceDark,
    borderColor: COLORS.borderDark,
  },
  optionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionTextDark: {
    color: COLORS.textDark,
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: 280,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalContentDark: {
    backgroundColor: COLORS.surfaceDark,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalTitleDark: {
    color: COLORS.textDark,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  modalSubtitleDark: {
    color: COLORS.textSecondaryDark,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInputDark: {
    borderColor: COLORS.borderDark,
    color: COLORS.textDark,
    backgroundColor: '#2A2A2A',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalCancelText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modalCancelTextDark: {
    color: COLORS.textSecondaryDark,
  },
  modalConfirmBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export { DurationSelector };
