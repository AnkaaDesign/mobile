import React, { useState, useCallback, useMemo } from "react";
import { View, Alert, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { Stack, router } from "expo-router";
import { IconFilter, IconPlus } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePaintTypeMutations, usePaintTypesInfinite } from "@/hooks";
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState } from "@/components/ui";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from "@/utils";
import { SECTOR_PRIVILEGES, PAINT_TYPE_ENUM, PAINT_TYPE_ENUM_LABELS } from "@/constants";
import { SearchBar } from "@/components/ui/search-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { useDebounce } from "@/hooks/use-debounce";
import { showToast } from "@/components/ui/toast";
import {
  IconCategory,
  IconDroplet,
  IconAlertTriangle,
  IconChevronRight,
  IconTrash,
  IconEdit,
} from "@tabler/icons-react-native";

interface PaintTypeItemProps {
  paintType: any;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

const PaintTypeItem: React.FC<PaintTypeItemProps> = ({
  paintType,
  onPress,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.itemContainer, { borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        {/* Type icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.accent }]}>
          <IconCategory size={24} color={colors.primary} />
        </View>

        {/* Type info */}
        <View style={styles.infoContainer}>
          <ThemedText style={[styles.itemName, { color: colors.foreground }]}>
            {paintType.name}
          </ThemedText>

          {/* Type badges */}
          <View style={styles.badgeContainer}>
            {paintType.type && (
              <Badge variant="secondary">
                {PAINT_TYPE_ENUM_LABELS[paintType.type as keyof typeof PAINT_TYPE_ENUM_LABELS] || paintType.type}
              </Badge>
            )}
            {paintType.needGround && (
              <Badge variant="warning">
                <IconAlertTriangle size={12} />
                Requer Fundo
              </Badge>
            )}
          </View>

          {/* Stats */}
          {paintType._count && (
            <View style={styles.statsContainer}>
              {paintType._count.paints !== undefined && (
                <View style={styles.statItem}>
                  <IconDroplet size={14} color={colors.mutedForeground} />
                  <ThemedText style={[styles.statText, { color: colors.mutedForeground }]}>
                    {paintType._count.paints} tintas
                  </ThemedText>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {canEdit && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary + "10" }]}
              onPress={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <IconEdit size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.destructive + "10" }]}
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <IconTrash size={18} color={colors.destructive} />
            </TouchableOpacity>
          )}
          <IconChevronRight size={20} color={colors.mutedForeground} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function PaintTypeListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 500);
  const { delete: deletePaintType } = usePaintTypeMutations();

  // Permissions
  const canCreate = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE) ||
                   hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE) ||
                 hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Build query
  const queryParams = useMemo(() => {
    const params: any = {
      include: {
        _count: {
          select: {
            paints: true,
            componentItems: true,
          },
        },
      },
      orderBy: { name: "asc" },
    };

    if (debouncedSearch) {
      params.where = {
        name: { contains: debouncedSearch, mode: "insensitive" },
      };
    }

    return params;
  }, [debouncedSearch]);

  // Fetch data
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = usePaintTypesInfinite(queryParams);

  const paintTypes = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) || [];
  }, [data]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCreate = () => {
    if (!canCreate) {
      showToast({ message: "Você não tem permissão para criar", type: "error" });
      return;
    }
    router.push("/(tabs)/painting/paint-types/create");
  };

  const handlePaintTypePress = (paintTypeId: string) => {
    router.push(`/(tabs)/painting/paint-types/details/${paintTypeId}`);
  };

  const handleEdit = (paintTypeId: string) => {
    if (!canEdit) {
      showToast({ message: "Você não tem permissão para editar", type: "error" });
      return;
    }
    router.push(`/(tabs)/painting/paint-types/edit/${paintTypeId}`);
  };

  const handleDelete = (paintTypeId: string, paintTypeName: string) => {
    if (!canDelete) {
      showToast({ message: "Você não tem permissão para excluir", type: "error" });
      return;
    }

    Alert.alert(
      "Excluir Tipo de Tinta",
      `Tem certeza que deseja excluir "${paintTypeName}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePaintType(paintTypeId);
              showToast({ message: "Tipo de tinta excluído com sucesso", type: "success" });
            } catch (error) {
              showToast({ message: "Erro ao excluir tipo de tinta", type: "error" });
            }
          },
        },
      ]
    );
  };

  const renderPaintType = useCallback(
    ({ item }: { item: any }) => (
      <PaintTypeItem
        paintType={item}
        onPress={() => handlePaintTypePress(item.id)}
        onEdit={() => handleEdit(item.id)}
        onDelete={() => handleDelete(item.id, item.name)}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    ),
    [canEdit, canDelete]
  );

  const renderEmpty = () => (
    <EmptyState
      title="Nenhum tipo de tinta encontrado"
      description={searchText ? "Tente ajustar sua busca" : "Cadastre o primeiro tipo de tinta"}
      icon={<IconCategory size={48} color={colors.mutedForeground} />}
    />
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ThemedText style={{ color: colors.mutedForeground }}>
          Carregando mais...
        </ThemedText>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Tipos de Tinta",
          headerBackTitle: "Voltar",
        }}
      />
      <ThemedView style={styles.container}>
        <TableErrorBoundary>
          {/* Search bar */}
          <View style={styles.searchContainer}>
            <SearchBar
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Buscar tipos de tinta..."
            />
          </View>

          {/* Item count */}
          <ItemsCountDisplay
            currentCount={paintTypes.length}
            totalCount={data?.pages[0]?.totalCount}
            isLoading={isLoading}
          />

          {/* List */}
          {isLoading ? (
            <LoadingScreen message="Carregando tipos de tinta..." />
          ) : isError ? (
            <ErrorScreen
              message="Erro ao carregar tipos de tinta"
              onRetry={refetch}
            />
          ) : (
            <FlatList
              data={paintTypes}
              renderItem={renderPaintType}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmpty}
              ListFooterComponent={renderFooter}
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.5}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          )}

          {/* FAB */}
          {canCreate && (
            <FAB
              icon={<IconPlus size={24} color="white" />}
              onPress={handleCreate}
              style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
            />
          )}
        </TableErrorBoundary>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  itemContainer: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  statsContainer: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: fontSize.sm,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  footerLoader: {
    padding: spacing.md,
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
  },
});