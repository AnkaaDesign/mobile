import React, { useMemo, useCallback } from "react";
import { View, StyleSheet, Pressable, Alert, FlatList } from "react-native";
import { IconCheck, IconX } from "@tabler/icons-react-native";
import type { PaintType } from "../../../../types";
import { useTheme } from "@/lib/theme";
import { formatDate } from "../../../../utils";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import type { SortConfig } from "@/lib/sort-utils";


// Column definition for PaintType
export interface DataColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: number;
  align?: "left" | "center" | "right";
  render?: (item: T) => React.ReactNode | { type: "badge" | "number"; text?: string; value?: number; variant?: string; icon?: any };
}

interface PaintTypeTableProps {
  paintTypes: PaintType[];
  onPaintTypePress: (paintTypeId: string) => void;
  onPaintTypeEdit: (paintTypeId: string) => void;
  onPaintTypeDelete: (paintTypeId: string) => void;
  onRefresh?: () => void;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedPaintTypes?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  visibleColumnKeys?: string[];
  enableSwipeActions?: boolean;
}

export function createColumnDefinitions(): DataColumn<PaintType>[] {
  return [
    {
      key: "name",
      header: "NOME",
      sortable: true,
      width: 180,
      render: (paintType) => paintType.name,
    },
    {
      key: "needGround",
      header: "PRECISA FUNDO",
      sortable: true,
      width: 120,
      align: "center",
      render: (paintType) => ({
        type: "badge" as const,
        text: paintType.needGround ? "Sim" : "Não",
        variant: paintType.needGround ? "default" : "secondary",
        icon: paintType.needGround ? IconCheck : IconX,
      }),
    },
    {
      key: "_count.paints",
      header: "TINTAS",
      sortable: false,
      width: 90,
      align: "center",
      render: (paintType) => ({
        type: "number" as const,
        value: paintType._count?.paints || 0,
      }),
    },
    {
      key: "createdAt",
      header: "CRIADO EM",
      sortable: true,
      width: 110,
      render: (paintType) => formatDate(paintType.createdAt),
    },
  ];
}

export function PaintTypeTable({
  paintTypes,
  onPaintTypePress,
  onPaintTypeEdit,
  onPaintTypeDelete,
  onRefresh,
  onEndReached,
  refreshing = false,
  loading = false,
  loadingMore = false,
  showSelection = false,
  selectedPaintTypes = new Set(),
  onSelectionChange,
  sortConfigs = [],
  onSort,
  visibleColumnKeys,
  enableSwipeActions = true,
}: PaintTypeTableProps) {
  const { colors } = useTheme();

  const columns = useMemo(() => createColumnDefinitions(), []);

  const handleDelete = useCallback(
    (paintType: PaintType) => {
      Alert.alert(
        "Confirmar exclusão",
        `Tem certeza que deseja deletar o tipo "${paintType.name}"?`,
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Deletar",
            style: "destructive",
            onPress: () => onPaintTypeDelete(paintType.id),
          },
        ]
      );
    },
    [onPaintTypeDelete]
  );

  const renderCell = useCallback((column: DataColumn<PaintType>, paintType: PaintType) => {
    if (!column.render) return null;

    const rendered = column.render(paintType);

    // Handle badge type
    if (typeof rendered === "object" && rendered !== null && "type" in rendered && !React.isValidElement(rendered)) {
      const data = rendered as { type: "badge" | "number"; text?: string; value?: number; variant?: string; icon?: any };

      if (data.type === "badge") {
        const IconComponent = data.icon;
        return (
          <Badge variant={data.variant as any} style={styles.badge}>
            {IconComponent && <IconComponent size={14} color={colors.foreground} />}
            <ThemedText style={styles.badgeText}>{data.text}</ThemedText>
          </Badge>
        );
      }
      if (data.type === "number") {
        return (
          <ThemedText style={styles.numberText}>{data.value}</ThemedText>
        );
      }
    }

    // Handle string/ReactNode
    return <ThemedText>{String(rendered)}</ThemedText>;
  }, [colors]);

  const renderItem = useCallback(({ item }: { item: PaintType }) => (
    <Pressable
      onPress={() => onPaintTypePress(item.id)}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.cardContent}>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Nome:</ThemedText>
          <ThemedText style={styles.value}>{item.name}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Precisa Fundo:</ThemedText>
          <Badge variant={item.needGround ? "default" : "secondary"} style={styles.badge}>
            {item.needGround ? <IconCheck size={14} color={colors.foreground} /> : <IconX size={14} color={colors.mutedForeground} />}
            <ThemedText style={styles.badgeText}>{item.needGround ? "Sim" : "Não"}</ThemedText>
          </Badge>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Tintas:</ThemedText>
          <ThemedText style={styles.value}>{item._count?.paints || 0}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Criado em:</ThemedText>
          <ThemedText style={styles.value}>{formatDate(item.createdAt)}</ThemedText>
        </View>
      </View>
    </Pressable>
  ), [onPaintTypePress, colors]);

  if (loading && paintTypes.length === 0) {
    return <LoadingScreen />;
  }

  if (paintTypes.length === 0) {
    return <EmptyState title="Nenhum tipo de tinta encontrado" />;
  }

  return (
    <FlatList
      data={paintTypes}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardContent: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  value: {
    fontSize: fontSize.sm,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  badgeText: {
    fontSize: fontSize.xs,
  },
  numberText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
