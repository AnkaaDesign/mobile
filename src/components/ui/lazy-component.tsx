/**
 * Lazy Component Wrapper with Loading State
 * Provides a consistent loading experience for lazy-loaded components
 */

import React, { Suspense } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';
import { ThemedText } from './themed-text';

interface LazyComponentProps {
  children: React.ReactNode;
  loadingText?: string;
  minHeight?: number;
}

export function LazyComponent({
  children,
  loadingText = 'Carregando...',
  minHeight = 200,
}: LazyComponentProps) {
  const { colors } = useTheme();

  return (
    <Suspense
      fallback={
        <View style={[styles.loadingContainer, { minHeight, backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          {loadingText && (
            <ThemedText style={styles.loadingText}>{loadingText}</ThemedText>
          )}
        </View>
      }
    >
      {children}
    </Suspense>
  );
}

interface LazyBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Error boundary for lazy loaded components
 */
export class LazyErrorBoundary extends React.Component<
  LazyBoundaryProps,
  { hasError: boolean; error?: Error }
> {
  constructor(props: LazyBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[LazyErrorBoundary] Component loading failed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>
              Falha ao carregar componente
            </ThemedText>
            <ThemedText style={styles.errorSubtext}>
              {this.state.error?.message}
            </ThemedText>
          </View>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper combining lazy loading with error boundary
 */
export function SafeLazyComponent({
  children,
  loadingText,
  minHeight = 200,
  errorFallback,
}: LazyComponentProps & { errorFallback?: React.ReactNode }) {
  return (
    <LazyErrorBoundary fallback={errorFallback}>
      <LazyComponent loadingText={loadingText} minHeight={minHeight}>
        {children}
      </LazyComponent>
    </LazyErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
});