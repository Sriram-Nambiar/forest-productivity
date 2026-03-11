import { router } from 'expo-router';
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

interface Props {
  children: ReactNode;
  darkMode?: boolean;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(
      '[ErrorBoundary] Caught error:',
      error.message,
      '\nComponent stack:',
      errorInfo.componentStack,
    );
  }

  handleReset = () => {
    this.setState({ hasError: false });
    // Navigate to the root route instead of re-rendering the broken child
    try {
      router.replace('/');
    } catch {
      // router may not be available if the error occurred during initial mount
    }
  };

  render() {
    if (this.state.hasError) {
      const isDark = this.props.darkMode ?? false;
      return (
        <View style={[styles.container, isDark && styles.containerDark]}>
          <Text style={[styles.emoji]}>🌿</Text>
          <Text style={[styles.title, isDark && styles.textDark]}>Something went wrong</Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            Please try again
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  containerDark: {
    backgroundColor: COLORS.backgroundDark,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  textDark: {
    color: COLORS.textDark,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  subtitleDark: {
    color: COLORS.textSecondaryDark,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
