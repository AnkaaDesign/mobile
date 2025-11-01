import { useState, useCallback, useMemo } from "react";
import { View, FlatList, StyleSheet, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconClipboardCheck, IconAlertTriangle, IconDeviceFloppy } from "@tabler/icons-react-native";
import { useItemsInfiniteMobile, useItemBatchMutations } from "@/hooks";
import type { Item } from "@/types";
import {
  ThemedView,
  ThemedText,
  Card,
  Button,
  ErrorScreen,
  EmptyState,
  SearchBar,
  Badge,
} from "@/components/ui";
import { ItemListSkeleton } from "@/components/inventory/item/skeleton/item-list-skeleton";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

/**
 * Stock Balance Page (Mobile Simplified Version)
 *
 * Simplified mobile-friendly stock balance interface that:
 * - Shows items with low stock (below reorder point)
 * - Allows quick quantity adjustments
 * - Focuses on essential inventory management
 *
 * Note: Full batch editing is not available on mobile due to screen constraints
 */

export default function StockBalancePage() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [adjustments, setAdjustments] = useState<Map<string, number>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  // Query for items - prioritize low stock items
  const queryParams = useMemo(() => ({
    orderBy: [
      { quantity: "asc" as const }, // Low stock first
      { name: "asc" as const },
    ],
    ...(searchText ? { searchingFor: searchText } : {}),
    include: {
      brand: true,
      category: true,
      _count: {
        activities: true,
      },
    },
  }), [searchText]);

  const {
    items,
    isLoading,
    error,
    
    
    loadMore,
    canLoadMore,
    
    
    
    refresh,
  } = useItemsInfiniteMobile(queryParams);

  const { batchUpdate } = useItemBatchMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleQuantityChange = useCallback((itemId: string, newQuantity: string) => {
    const quantity = parseInt(newQuantity, 10);
    if (!isNaN(quantity) && quantity >= 0) {
      setAdjustments(prev => {
        const newMap = new Map(prev);
        newMap.set(itemId, quantity);
        return newMap;
      });
    } else if (newQuantity === "") {
      setAdjustments(prev => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
    }
  }, []);

  const handleSaveBalance = useCallback(async () => {
    if (adjustments.size === 0) {
      Alert.alert("Nenhuma Alteração", "Nenhuma quantidade foi alterada.");
      return;
    }

    const changedItems = Array.from(adjustments.entries()).map(([id, quantity]) => {
      const item = items.find((i: any /* TODO: Add proper type */) => i.id === id);
      return {
        id,
        currentQuantity: item?.quantity || 0,
        newQuantity: quantity,
      };
    });

    Alert.alert(
      "Confirmar Balanço de Estoque",
      `Você está prestes a atualizar ${changedItems.length} ${changedItems.length === 1 ? 'item' : 'itens'}.\n\nDeseja continuar?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            setIsSaving(true);
            try {
              const updateData = changedItems.map(({ id, newQuantity }) => ({
                id,
                data: { quantity: newQuantity },
              }));

              await batchUpdate(updateData as any);

              Alert.alert(
                "Sucesso",
                `Balanço de estoque atualizado com sucesso!\n${changedItems.length} ${changedItems.length === 1 ? 'item atualizado' : 'itens atualizados'}.`,
                [
                  {
                    text: "OK",
                    onPress: () => {
                      setAdjustments(new Map());
                      handleRefresh();
                    },
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert("Erro", error.message || "Erro ao atualizar balanço de estoque.");
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  }, [adjustments, items, batchUpdate, handleRefresh]);

  const handleCancel = () => {
    if (adjustments.size > 0) {
      Alert.alert(
        "Descartar Alterações",
        "Você tem alterações não salvas. Deseja descartá-las?",
        [
          { text: "Continuar Editando", style: "cancel" },
          {
            text: "Descartar",
            style: "destructive",
            onPress: () => {
              setAdjustments(new Map());
              router.back();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const getStockStatus = (item: Item): "critical" | "low" | "normal" | "high" => {
    const { quantity, reorderPoint, maxQuantity } = item;

    if (quantity === 0) return "critical";
    if (reorderPoint && quantity <= reorderPoint) return "low";
    if (maxQuantity && quantity >= maxQuantity) return "high";
    return "normal";
  };

  const getStockBadgeVariant = (status: string) => {
    switch (status) {
      case "critical": return "destructive";
      case "low": return "warning";
      case "high": return "secondary";
      default: return "default";
    }
  };

  const renderItemCard = ({ item }: { item: Item }) => {
    const status = getStockStatus(item);
    const adjustedQuantity = adjustments.get(item.id);
    const currentQuantity = adjustedQuantity !== undefined ? adjustedQuantity : item.quantity;
    const hasChanges = adjustedQuantity !== undefined && adjustedQuantity !== item.quantity;

    return (
      <Card style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <ThemedText style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
              {item.name}
            </ThemedText>
            {item.uniCode && (
              <ThemedText style={[styles.itemCode, { color: colors.mutedForeground }]}>
                #{item.uniCode}
              </ThemedText>
            )}
            {item.category && (
              <ThemedText style={[styles.itemCategory, { color: colors.mutedForeground }]}>
                {item.category.name}
              </ThemedText>
            )}
          </View>
          <Badge variant={getStockBadgeVariant(status)}>
            {status === "critical" ? "Crítico" : status === "low" ? "Baixo" : status === "high" ? "Alto" : "Normal"}
          </Badge>
        </View>

        <View style={styles.quantityContainer}>
          <View style={styles.quantityInfo}>
            <ThemedText style={[styles.quantityLabel, { color: colors.mutedForeground }]}>
              Estoque Atual
            </ThemedText>
            <ThemedText style={[styles.quantityValue, { color: hasChanges ? colors.mutedForeground : colors.foreground }]}>
              {item.quantity}
            </ThemedText>
          </View>

          <View style={styles.quantityInputContainer}>
            <ThemedText style={[styles.quantityLabel, { color: colors.mutedForeground }]}>
              Nova Quantidade
            </ThemedText>
            <TextInput
              style={[
                styles.quantityInput,
                {
                  backgroundColor: colors.input,
                  borderColor: hasChanges ? colors.primary : colors.border,
                  color: colors.foreground,
                },
              ]}
              value={currentQuantity.toString()}
              onChangeText={(text) => handleQuantityChange(item.id, text)}
              keyboardType="numeric"
              placeholder={item.quantity.toString()}
              placeholderTextColor={colors.mutedForeground}
              editable={!isSaving}
            />
          </View>

          {item.reorderPoint && (
            <View style={styles.reorderInfo}>
              <IconAlertTriangle size={14} color={colors.mutedForeground} />
              <ThemedText style={[styles.reorderText, { color: colors.mutedForeground }]}>
                Ponto de pedido: {item.reorderPoint}
              </ThemedText>
            </View>
          )}
        </View>

        {hasChanges && (
          <View style={[styles.changeIndicator, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
            <ThemedText style={[styles.changeText, { color: colors.primary }]}>
              Diferença: {adjustedQuantity! - item.quantity > 0 ? '+' : ''}{adjustedQuantity! - item.quantity}
            </ThemedText>
          </View>
        )}
      </Card>
    );
  };

  if (isLoading && items.length === 0) {
    return <ItemListSkeleton />;
  }

  if (error && items.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar produtos"
          detail={error.message}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  const hasItems = Array.isArray(items) && items.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <IconClipboardCheck size={24} color={colors.primary} />
            <ThemedText style={styles.title}>Balanço de Estoque</ThemedText>
          </View>
          {adjustments.size > 0 && (
            <Badge variant="primary">
              {adjustments.size} {adjustments.size === 1 ? 'alteração' : 'alterações'}
            </Badge>
          )}
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar produtos..."
          style={styles.searchBar}
          debounceMs={300}
        />
      </View>

      {/* Items List */}
      {hasItems ? (
        <FlatList
          data={items}
          renderItem={renderItemCard}
          keyExtractor={(item) => item.id}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={canLoadMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "clipboard-check"}
            title={searchText ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando o primeiro produto"}
          />
        </View>
      )}

      {/* Action Buttons */}
      <View style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom }]}>
        <Button
          variant="outline"
          onPress={handleCancel}
          disabled={isSaving}
          style={styles.actionButton}
        >
          <ThemedText>Cancelar</ThemedText>
        </Button>

        <Button
          variant="default"
          onPress={handleSaveBalance}
          disabled={adjustments.size === 0 || isSaving}
          style={styles.actionButton}
        >
          <IconDeviceFloppy size={20} color="white" />
          <ThemedText style={{ color: "white" }}>
            {isSaving ? "Salvando..." : "Salvar Balanço"}
          </ThemedText>
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchBar: {
    flex: 1,
  },
  itemCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    padding: spacing.md,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xxs,
  },
  itemCode: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xxs,
  },
  itemCategory: {
    fontSize: fontSize.sm,
  },
  quantityContainer: {
    gap: spacing.sm,
  },
  quantityInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityLabel: {
    fontSize: fontSize.sm,
  },
  quantityValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  quantityInputContainer: {
    gap: spacing.xxs,
  },
  quantityInput: {
    height: 48,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  reorderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  reorderText: {
    fontSize: fontSize.sm,
  },
  changeIndicator: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
  },
  changeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
});
