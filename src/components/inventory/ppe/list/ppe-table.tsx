import React from "react";
import { FlatList, RefreshControl, View, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { ErrorScreen } from "@/components/ui/error-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { ThemedText } from "@/components/ui/themed-text";
import { PpeTableRowSwipe } from "./ppe-table-row-swipe";
import { PpeListSkeleton } from "../skeleton/ppe-list-skeleton";
import type { PpeDelivery } from '../../../../types';

interface PpeTableProps {
  ppes: PpeDelivery[];
  isLoading: boolean;
  error: Error | null;
  onPpePress: (ppeId: string) => void;
  onDelete: (ppeId: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onEndReach: () => void;
  canLoadMore?: boolean;
  loadingMore?: boolean;
}

export const PpeTable: React.FC<PpeTableProps> = ({
  ppes,
  isLoading,
  error,
  onPpePress,
  onDelete,
  onRefresh,
  refreshing,
  onEndReach,
  canLoadMore,
  loadingMore,
}) => {
  const { colors } = useTheme();

  if (isLoading && ppes.length === 0) {
    return <PpeListSkeleton />;
  }

  if (error) {
    return (
      <ErrorScreen
        message="Erro ao carregar EPIs"
        detail={error.message}
        onRetry={onRefresh}
      />
    );
  }

  if (!ppes || ppes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          icon="shield"
          title="Nenhum EPI encontrado"
          description="Não há EPIs cadastrados ou que correspondam aos filtros aplicados."
        />
      </View>
    );
  }

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando mais...</ThemedText>
      </View>
    );
  };

  return (
    <FlatList
      data={ppes}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PpeTableRowSwipe
          ppe={item}
          onPress={() => onPpePress(item.id)}
          onDelete={() => onDelete(item.id)}
        />
      )}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      onEndReached={() => {
        if (canLoadMore && !loadingMore) {
          onEndReach();
        }
      }}
      onEndReachedThreshold={0.2}
      ListFooterComponent={renderFooter}
      contentContainerStyle={ppes.length === 0 ? styles.emptyList : styles.list}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={15}
      updateCellsBatchingPeriod={50}
      getItemLayout={(data, index) => ({
        length: 80, // Estimate based on row height
        offset: 80 * index,
        index,
      })}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 3,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  footerLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.7,
  },
});