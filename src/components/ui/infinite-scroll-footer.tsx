
import { View, ActivityIndicator , StyleSheet} from "react-native";
import { IconCheck, IconAlertCircle } from "@tabler/icons-react-native";
import { ThemedText } from "./themed-text";
import { Button } from "./button";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

interface InfiniteScrollFooterProps {
  loading?: boolean;
  error?: Error | null;
  hasMore?: boolean;
  onRetry?: () => void;
  loadedCount?: number;
  currentPage?: number;
}

export function InfiniteScrollFooter({ loading = false, error = null, hasMore = true, onRetry, loadedCount = 0, currentPage = 0 }: InfiniteScrollFooterProps) {
  const { colors } = useTheme();

  // Show nothing if not loading, no error, and no more items
  if (!loading && !error && !hasMore) {
    return (
      <View style={styles.container}>
        <View style={StyleSheet.flatten([styles.endIndicator, { backgroundColor: colors.muted }])}>
          <IconCheck size={20} color={colors.mutedForeground} />
          <ThemedText style={StyleSheet.flatten([styles.endText, { color: colors.mutedForeground }])}>Todos os itens foram carregados</ThemedText>
          {loadedCount > 0 && (
            <ThemedText style={StyleSheet.flatten([styles.countText, { color: colors.mutedForeground }])}>
              {loadedCount} {loadedCount === 1 ? "item" : "itens"} carregados
            </ThemedText>
          )}
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={StyleSheet.flatten([styles.errorContainer, { backgroundColor: colors.destructive + "10" }])}>
          <IconAlertCircle size={24} color={colors.destructive} />
          <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.destructive }])}>Erro ao carregar mais itens</ThemedText>
          <ThemedText style={StyleSheet.flatten([styles.errorMessage, { color: colors.mutedForeground }])}>{error.message || "Ocorreu um erro inesperado"}</ThemedText>
          {onRetry && (
            <Button variant="outline" size="sm" onPress={onRetry} style={StyleSheet.flatten([styles.retryButton, { borderColor: colors.destructive }])}>
              <ThemedText style={{ color: colors.destructive }}>Tentar novamente</ThemedText>
            </Button>
          )}
        </View>
      </View>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={StyleSheet.flatten([styles.loadingText, { color: colors.mutedForeground }])}>Carregando mais itens...</ThemedText>
          {currentPage > 1 && <ThemedText style={StyleSheet.flatten([styles.pageText, { color: colors.mutedForeground }])}>Página {currentPage}</ThemedText>}
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  loadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  pageText: {
    fontSize: fontSize.xs,
    opacity: 0.7,
  },
  errorContainer: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginHorizontal: spacing.sm,
  },
  errorTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: fontSize.xs,
    textAlign: "center",
    lineHeight: 16,
  },
  retryButton: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  endIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    marginHorizontal: spacing.xl,
  },
  endText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  countText: {
    fontSize: fontSize.xs,
    opacity: 0.8,
    marginLeft: spacing.xs,
  },
});
