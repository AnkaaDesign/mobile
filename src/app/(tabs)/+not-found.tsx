import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView, ThemedText, Button } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { Icon } from '@/components/ui/icon';

/**
 * Catch-all fallback route for unimplemented or non-existent pages
 * This prevents navigation warnings and provides a better user experience
 */
export default function NotFoundScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const handleGoHome = () => {
    router.replace('/(tabs)/home');
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Icon name="alert-circle" size={64} variant="muted" />
        </View>

        {/* Title */}
        <ThemedText style={styles.title}>Página não encontrada</ThemedText>

        {/* Description */}
        <ThemedText style={[styles.description, { color: colors.mutedForeground }]}>
          A página que você está tentando acessar não existe ou ainda não foi implementada.
        </ThemedText>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            onPress={handleGoBack}
            variant="outline"
            style={styles.button}
          >
            Voltar
          </Button>
          <Button
            onPress={handleGoHome}
            variant="default"
            style={styles.button}
          >
            Ir para Início
          </Button>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
  },
});
