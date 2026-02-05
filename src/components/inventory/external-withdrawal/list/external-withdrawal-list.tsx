import React, { useCallback } from 'react';
import { FlatList, View, StyleSheet, RefreshControl, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ExternalWithdrawal } from '@/types';
import { useTheme } from '@/lib/theme';
import { ExternalWithdrawalRowCard } from './external-withdrawal-row-card';
import { ExternalWithdrawalTableRowSwipe } from './external-withdrawal-table-row-swipe';
import { ExternalWithdrawalListSkeleton } from './external-withdrawal-list-skeleton';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface ExternalWithdrawalListProps {
  data: ExternalWithdrawal[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  isFetchingNextPage?: boolean;
  onRefresh?: () => Promise<void>;
  onLoadMore?: () => void;
  canLoadMore?: boolean;
  onEdit?: (withdrawalId: string) => void;
  onDelete?: (withdrawalId: string) => void;
  onView?: (withdrawalId: string) => void;
  onCreateNew?: () => void;
  enableSwipeActions?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  ListHeaderComponent?: React.ReactElement | null;
  ListFooterComponent?: React.ReactElement | null;
}

export const ExternalWithdrawalList = React.memo<ExternalWithdrawalListProps>(
  ({
    data,
    isLoading = false,
    isRefreshing = false,
    isFetchingNextPage = false,
    onRefresh,
    onLoadMore,
    canLoadMore = false,
    onEdit,
    onDelete,
    onView,
    onCreateNew,
    enableSwipeActions = true,
    emptyStateTitle = 'Nenhuma retirada encontrada',
    emptyStateDescription = 'Comece registrando a primeira retirada externa.',
    ListHeaderComponent,
    ListFooterComponent,
  }) => {
    const { colors } = useTheme();
    const router = useRouter();

    const handleView = useCallback(
      (withdrawalId: string) => {
        if (onView) {
          onView(withdrawalId);
        } else {
          router.push(`/estoque/retiradas-externas/detalhes/${withdrawalId}`);
        }
      },
      [onView, router]
    );

    const handleEdit = useCallback(
      (withdrawalId: string) => {
        if (onEdit) {
          onEdit(withdrawalId);
        } else {
          router.push(`/estoque/retiradas-externas/editar/${withdrawalId}`);
        }
      },
      [onEdit, router]
    );

    const handleRowPress = useCallback(
      (withdrawal: ExternalWithdrawal) => {
        handleView(withdrawal.id);
      },
      [handleView]
    );

    const renderItem = useCallback(
      ({ item }: { item: ExternalWithdrawal }) => {
        const rowContent = <ExternalWithdrawalRowCard withdrawal={item} onPress={handleRowPress} />;

        if (enableSwipeActions) {
          return (
            <ExternalWithdrawalTableRowSwipe
              withdrawalId={item.id}
              withdrawalName={item.withdrawerName}
              withdrawalStatus={item.status}
              onView={handleView}
              onEdit={onEdit ? handleEdit : undefined}
              onDelete={onDelete}
            >
              {rowContent}
            </ExternalWithdrawalTableRowSwipe>
          );
        }

        return rowContent;
      },
      [enableSwipeActions, handleRowPress, handleView, handleEdit, onEdit, onDelete]
    );

    const keyExtractor = useCallback((item: ExternalWithdrawal) => item.id, []);

    const renderFooter = useCallback(() => {
      if (ListFooterComponent) {
        return ListFooterComponent;
      }

      if (isFetchingNextPage) {
        return (
          <View style={styles.footerLoader}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              Carregando mais...
            </Text>
          </View>
        );
      }

      return null;
    }, [isFetchingNextPage, ListFooterComponent, colors.mutedForeground]);

    const renderEmpty = useCallback(() => {
      if (isLoading) {
        return null;
      }

      return (
        <View style={styles.emptyContainer}>
          <Icon name="package-export" size={64} color={colors.mutedForeground} opacity={0.3} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {emptyStateTitle}
          </Text>
          <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
            {emptyStateDescription}
          </Text>
          {onCreateNew && (
            <Button onPress={onCreateNew} variant="outline" style={styles.emptyButton}>
              <Icon name="plus" size={16} color={colors.foreground} />
              <Text style={[styles.emptyButtonText, { color: colors.foreground }]}>
                Nova Retirada
              </Text>
            </Button>
          )}
        </View>
      );
    }, [
      isLoading,
      emptyStateTitle,
      emptyStateDescription,
      onCreateNew,
      colors.foreground,
      colors.mutedForeground,
    ]);

    const handleEndReached = useCallback(() => {
      if (canLoadMore && !isFetchingNextPage && onLoadMore) {
        onLoadMore();
      }
    }, [canLoadMore, isFetchingNextPage, onLoadMore]);

    const handleRefresh = useCallback(async () => {
      if (onRefresh) {
        await onRefresh();
      }
    }, [onRefresh]);

    if (isLoading) {
      return <ExternalWithdrawalListSkeleton />;
    }

    return (
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.contentContainer,
          data.length === 0 && styles.emptyContentContainer,
        ]}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
        initialNumToRender={10}
      />
    );
  }
);

ExternalWithdrawalList.displayName = 'ExternalWithdrawalList';

const styles = StyleSheet.create({
  contentContainer: {
    paddingVertical: 8,
  },
  emptyContentContainer: {
    flexGrow: 1,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
