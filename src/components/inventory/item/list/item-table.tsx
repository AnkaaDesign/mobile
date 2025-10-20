import React, { useState, useCallback, useMemo, useRef } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import { IconSelector } from "@tabler/icons-react-native";
import type { Item } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { ItemTableRowSwipe } from "./item-table-row-swipe";
import { StockStatusIndicator } from "./stock-status-indicator";
import { getDefaultVisibleColumns } from "./column-visibility-manager";
import { formatCurrency } from '../../../../utils';
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (item: Item) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

export interface SortConfig {
  columnKey: string;
  direction: "asc" | "desc";
}

interface ItemTableProps {
  items: Item[];
  onItemPress?: (itemId: string) => void;
  onItemEdit?: (itemId: string) => void;
  onItemDelete?: (itemId: string) => void;
  onItemDuplicate?: (itemId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedItems?: Set<string>;
  onSelectionChange?: (selectedItems: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  enableSwipeActions?: boolean;
  visibleColumnKeys?: string[];
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Define all available columns with their renderers
export const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "uniCode",
    header: "CÓDIGO",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {item.uniCode || "-"}
      </ThemedText>
    ),
  },
  {
    key: "name",
    header: "NOME",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.nameText])} numberOfLines={2}>
        {item.name}
      </ThemedText>
    ),
  },
  {
    key: "brand.name",
    header: "MARCA",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {item.brand?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "category.name",
    header: "CATEGORIA",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {item.category?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "measures",
    header: "MEDIDAS",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (item: Item) => {
      // Display measures in compact format
      if (!item.measures || item.measures.length === 0) {
        return (
          <ThemedText style={styles.cellText} numberOfLines={1}>
            -
          </ThemedText>
        );
      }
      const measureText = item.measures
        .map((m) => `${m.value || '-'}${m.unit || ''}`)
        .join(' × ');
      return (
        <ThemedText style={styles.cellText} numberOfLines={1}>
          {measureText}
        </ThemedText>
      );
    },
  },
  {
    key: "quantity",
    header: "QUANTIDADE",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <View style={styles.quantityCell}>
        <StockStatusIndicator item={item} />
        <ThemedText style={styles.quantityText} numberOfLines={1}>
          {item.quantity || 0}
        </ThemedText>
      </View>
    ),
  },
  {
    key: "monthlyConsumption",
    header: "CONSUMO MENSAL",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (item: Item) => {
      const consumption = item.monthlyConsumption;
      const trend = item.monthlyConsumptionTrendPercent;

      if (!consumption) {
        return (
          <ThemedText style={styles.cellText} numberOfLines={1}>
            -
          </ThemedText>
        );
      }

      const formattedConsumption = consumption % 1 === 0
        ? consumption.toLocaleString("pt-BR")
        : consumption.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      return (
        <View style={styles.consumptionCell}>
          <ThemedText style={styles.cellText} numberOfLines={1}>
            {formattedConsumption}
          </ThemedText>
          {trend !== null && trend !== 0 && (
            <View style={styles.trendContainer}>
              <Icon
                name={trend > 0 ? "trending-up" : "trending-down"}
                size="xs"
                color={trend > 0 ? badgeColors.error.text : badgeColors.success.text}
              />
              <ThemedText
                style={[
                  styles.trendText,
                  { color: trend > 0 ? badgeColors.error.text : badgeColors.success.text }
                ]}
              >
                {Math.abs(trend).toFixed(1)}%
              </ThemedText>
            </View>
          )}
        </View>
      );
    },
  },
  {
    key: "price",
    header: "PREÇO",
    align: "right",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])} numberOfLines={1}>
        {item.prices?.[0]?.value ? formatCurrency(item.prices[0].value) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "totalPrice",
    header: "VALOR TOTAL",
    align: "right",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])} numberOfLines={1}>
        {item.totalPrice ? formatCurrency(item.totalPrice) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "abcxyz",
    header: "ABC/XYZ",
    align: "center",
    sortable: false,
    width: 0,
    accessor: (item: Item) => (
      <View style={styles.abcXyzContainer}>
        <Badge
          variant="secondary"
          size="sm"
          style={{
            backgroundColor: item.abcCategory === "A" ? badgeColors.error.background : item.abcCategory === "B" ? badgeColors.warning.background : badgeColors.success.background,
            borderWidth: 0,
          }}
        >
          <ThemedText
            style={{
              color: item.abcCategory === "A" ? badgeColors.error.text : item.abcCategory === "B" ? badgeColors.warning.text : badgeColors.success.text,
              fontSize: fontSize.xs,
              fontWeight: fontWeight.medium,
            }}
          >
            {item.abcCategory || "C"}
          </ThemedText>
        </Badge>
        <Badge
          variant="secondary"
          size="sm"
          style={{
            backgroundColor:
              item.xyzCategory === "X" ? badgeColors.info.background : item.xyzCategory === "Y" ? "rgba(156, 163, 175, 0.15)" : badgeColors.warning.background,
            borderWidth: 0,
          }}
        >
          <ThemedText
            style={{
              color: item.xyzCategory === "X" ? badgeColors.info.text : item.xyzCategory === "Y" ? "#6b7280" : badgeColors.warning.text,
              fontSize: fontSize.xs,
              fontWeight: fontWeight.medium,
            }}
          >
            {item.xyzCategory || "Z"}
          </ThemedText>
        </Badge>
      </View>
    ),
  },
  {
    key: "CA",
    header: "CA",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {item.ppeCA || "-"}
      </ThemedText>
    ),
  },
  {
    key: "barcodes",
    header: "CÓDIGOS DE BARRAS",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.monoText])} numberOfLines={1}>
        {item.barcodes?.length > 0 ? item.barcodes.join(", ") : "-"}
      </ThemedText>
    ),
  },
  {
    key: "maxQuantity",
    header: "QTD. MÁXIMA",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])} numberOfLines={1}>
        {item.maxQuantity !== null && item.maxQuantity !== undefined
          ? item.maxQuantity % 1 === 0
            ? item.maxQuantity.toLocaleString("pt-BR")
            : item.maxQuantity.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : "-"}
      </ThemedText>
    ),
  },
  {
    key: "reorderPoint",
    header: "PONTO DE REPOSIÇÃO",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])} numberOfLines={1}>
        {item.reorderPoint !== null && item.reorderPoint !== undefined
          ? item.reorderPoint % 1 === 0
            ? item.reorderPoint.toLocaleString("pt-BR")
            : item.reorderPoint.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : "-"}
      </ThemedText>
    ),
  },
  {
    key: "reorderQuantity",
    header: "QTD. DE REPOSIÇÃO",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])} numberOfLines={1}>
        {item.reorderQuantity !== null && item.reorderQuantity !== undefined
          ? item.reorderQuantity % 1 === 0
            ? item.reorderQuantity.toLocaleString("pt-BR")
            : item.reorderQuantity.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : "-"}
      </ThemedText>
    ),
  },
  {
    key: "boxQuantity",
    header: "QTD. POR CAIXA",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])} numberOfLines={1}>
        {item.boxQuantity !== null && item.boxQuantity !== undefined
          ? item.boxQuantity % 1 === 0
            ? item.boxQuantity.toLocaleString("pt-BR")
            : item.boxQuantity.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : "-"}
      </ThemedText>
    ),
  },
  {
    key: "tax",
    header: "TAXA",
    align: "right",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])} numberOfLines={1}>
        {item.tax !== null && item.tax !== undefined
          ? `${item.tax % 1 === 0 ? item.tax.toLocaleString("pt-BR") : item.tax.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
          : "-"}
      </ThemedText>
    ),
  },
  {
    key: "supplier.fantasyName",
    header: "FORNECEDOR",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {item.supplier?.fantasyName || "-"}
      </ThemedText>
    ),
  },
  {
    key: "ppeType",
    header: "TIPO EPI",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (item: Item) => {
      if (!item.ppeType) {
        return (
          <ThemedText style={styles.cellText} numberOfLines={1}>
            -
          </ThemedText>
        );
      }
      // Map PPE_TYPE values to labels (simplified for mobile)
      const ppeTypeLabels: Record<string, string> = {
        'HEAD': 'Cabeça',
        'EYES': 'Olhos',
        'EARS': 'Ouvidos',
        'RESPIRATORY': 'Respiratório',
        'HANDS': 'Mãos',
        'FEET': 'Pés',
        'BODY': 'Corpo',
        'FALL_PROTECTION': 'Queda',
        'OTHER': 'Outro'
      };
      return (
        <Badge variant="outline" size="sm">
          <ThemedText style={{ fontSize: fontSize.xs }}>
            {ppeTypeLabels[item.ppeType] || item.ppeType}
          </ThemedText>
        </Badge>
      );
    },
  },
  {
    key: "ppeSize",
    header: "TAMANHO EPI",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (item: Item) => {
      if (!item.ppeSize) {
        return (
          <ThemedText style={styles.cellText} numberOfLines={1}>
            -
          </ThemedText>
        );
      }
      return (
        <Badge variant="outline" size="sm">
          <ThemedText style={{ fontSize: fontSize.xs }}>
            {item.ppeSize.replace("SIZE_", "")}
          </ThemedText>
        </Badge>
      );
    },
  },
  {
    key: "shouldAssignToUser",
    header: "ATRIBUIR AO USUÁRIO",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <View style={styles.centerAlign}>
        <Badge
          variant={item.shouldAssignToUser ? "default" : "secondary"}
          size="sm"
          style={{
            backgroundColor: item.shouldAssignToUser ? badgeColors.success.background : badgeColors.muted.background,
            borderWidth: 0,
          }}
        >
          <ThemedText
            style={{
              color: item.shouldAssignToUser ? badgeColors.success.text : badgeColors.muted.text,
              fontSize: fontSize.xs,
              fontWeight: fontWeight.medium,
            }}
          >
            {item.shouldAssignToUser ? "Sim" : "Não"}
          </ThemedText>
        </Badge>
      </View>
    ),
  },
  {
    key: "estimatedLeadTime",
    header: "PRAZO ESTIMADO",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])} numberOfLines={1}>
        {item.estimatedLeadTime ? `${item.estimatedLeadTime} dias` : "-"}
      </ThemedText>
    ),
  },
  {
    key: "isActive",
    header: "STATUS",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <View style={styles.centerAlign}>
        <Badge
          variant={item.isActive ? "default" : "secondary"}
          size="sm"
          style={{
            backgroundColor: item.isActive ? badgeColors.success.background : badgeColors.muted.background,
            borderWidth: 0,
          }}
        >
          <ThemedText
            style={{
              color: item.isActive ? badgeColors.success.text : badgeColors.muted.text,
              fontSize: fontSize.xs,
              fontWeight: fontWeight.medium,
            }}
          >
            {item.isActive ? "Ativo" : "Inativo"}
          </ThemedText>
        </Badge>
      </View>
    ),
  },
  {
    key: "activitiesCount",
    header: "ATIVIDADES",
    align: "center",
    sortable: false,
    width: 0,
    accessor: (item: Item) => (
      <View style={styles.centerAlign}>
        <Badge variant="outline" size="sm">
          <ThemedText style={{ fontSize: fontSize.xs, fontFamily: 'monospace' }}>
            {(item as any)._count?.activities || 0}
          </ThemedText>
        </Badge>
      </View>
    ),
  },
  {
    key: "borrowsCount",
    header: "EMPRÉSTIMOS",
    align: "center",
    sortable: false,
    width: 0,
    accessor: (item: Item) => (
      <View style={styles.centerAlign}>
        <Badge variant="outline" size="sm">
          <ThemedText style={{ fontSize: fontSize.xs, fontFamily: 'monospace' }}>
            {(item as any)._count?.borrows || 0}
          </ThemedText>
        </Badge>
      </View>
    ),
  },
  {
    key: "pricesCount",
    header: "HISTÓRICO PREÇOS",
    align: "center",
    sortable: false,
    width: 0,
    accessor: (item: Item) => (
      <View style={styles.centerAlign}>
        <Badge variant="outline" size="sm">
          <ThemedText style={{ fontSize: fontSize.xs, fontFamily: 'monospace' }}>
            {(item as any)._count?.prices || 0}
          </ThemedText>
        </Badge>
      </View>
    ),
  },
  {
    key: "createdAt",
    header: "CRIADO EM",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, { fontSize: fontSize.sm }])} numberOfLines={1}>
        {new Date(item.createdAt).toLocaleDateString("pt-BR")}
      </ThemedText>
    ),
  },
  {
    key: "updatedAt",
    header: "ATUALIZADO EM",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, { fontSize: fontSize.sm }])} numberOfLines={1}>
        {new Date(item.updatedAt).toLocaleDateString("pt-BR")}
      </ThemedText>
    ),
  },
];

export const ItemTable = React.memo<ItemTableProps>(
  ({
    items,
    onItemPress,
    onItemEdit,
    onItemDelete,
    onItemDuplicate,
    onRefresh,
    onEndReached,
    refreshing = false,
    loading = false,
    loadingMore = false,
    showSelection = false,
    selectedItems = new Set(),
    onSelectionChange,
    sortConfigs = [],
    onSort,
    enableSwipeActions = true,
    visibleColumnKeys,
  }) => {
    const { colors, isDark } = useTheme();
    const { activeRowId, closeActiveRow } = useSwipeRow();
    const [headerHeight, setHeaderHeight] = useState(50);
    const flatListRef = useRef<FlatList>(null);

    // Column visibility - use prop if provided, otherwise use default
    const visibleColumns = useMemo(() => {
      if (visibleColumnKeys && visibleColumnKeys.length > 0) {
        return new Set(visibleColumnKeys);
      }
      return getDefaultVisibleColumns();
    }, [visibleColumnKeys]);

    // Get all column definitions
    const allColumns = useMemo(() => createColumnDefinitions(), []);

    // Build visible columns with dynamic widths
    const displayColumns = useMemo(() => {
      // Define width ratios for each column type
      const columnWidthRatios: Record<string, number> = {
        uniCode: 1.2,
        name: 2.0,
        "brand.name": 1.2,
        "category.name": 1.2,
        measures: 1.4,
        quantity: 0.9,
        monthlyConsumption: 1.5,
        price: 1.0,
        totalPrice: 1.2,
        abcxyz: 1.0,
        CA: 1.0,
        barcodes: 1.6,
        maxQuantity: 1.0,
        reorderPoint: 1.2,
        reorderQuantity: 1.2,
        boxQuantity: 1.0,
        tax: 0.8,
        "supplier.fantasyName": 1.4,
        ppeType: 1.2,
        ppeSize: 1.0,
        shouldAssignToUser: 1.4,
        estimatedLeadTime: 1.2,
        isActive: 0.9,
        activitiesCount: 1.0,
        borrowsCount: 1.0,
        pricesCount: 1.2,
        createdAt: 1.2,
        updatedAt: 1.2,
      };

      // Filter to visible columns
      const visible = allColumns.filter((col) => visibleColumns.has(col.key));

      // Calculate total ratio
      const totalRatio = visible.reduce((sum, col) => sum + (columnWidthRatios[col.key] || 1.0), 0);

      // Calculate actual widths
      return visible.map((col) => {
        const ratio = columnWidthRatios[col.key] || 1.0;
        const width = Math.floor((availableWidth * ratio) / totalRatio);
        return { ...col, width };
      });
    }, [allColumns, visibleColumns]);

    // Handle taps outside of active row to close swipe actions
    const handleContainerPress = useCallback(() => {
      if (activeRowId) {
        closeActiveRow();
      }
    }, [activeRowId, closeActiveRow]);

    // Handle scroll events to close active row
    const handleScroll = useCallback(() => {
      if (activeRowId) {
        closeActiveRow();
      }
    }, [activeRowId, closeActiveRow]);

    // Calculate total table width
    const tableWidth = useMemo(() => {
      let width = displayColumns.reduce((sum, col) => sum + col.width, 0);
      if (showSelection) width += 50; // Add checkbox column width
      return width;
    }, [displayColumns, showSelection]);

    // Selection handlers
    const handleSelectAll = useCallback(() => {
      if (!onSelectionChange) return;

      const allSelected = items.every((item) => selectedItems.has(item.id));
      if (allSelected) {
        onSelectionChange(new Set());
      } else {
        onSelectionChange(new Set(items.map((item) => item.id)));
      }
    }, [items, selectedItems, onSelectionChange]);

    const handleSelectItem = useCallback(
      (itemId: string) => {
        if (!onSelectionChange) return;

        const newSelection = new Set(selectedItems);
        if (newSelection.has(itemId)) {
          newSelection.delete(itemId);
        } else {
          newSelection.add(itemId);
        }
        onSelectionChange(newSelection);
      },
      [selectedItems, onSelectionChange],
    );

    // Sort handler - non-cumulative (only one sort at a time)
    const handleSort = useCallback(
      (columnKey: string) => {
        if (!onSort) return;

        const existingConfig = sortConfigs?.find((config) => config.columnKey === columnKey);

        if (existingConfig) {
          // Column already sorted, toggle direction or remove
          if (existingConfig.direction === "asc") {
            // Toggle to descending
            onSort([{ columnKey, direction: "desc" as const }]);
          } else {
            // Remove sort (back to no sort)
            onSort([]);
          }
        } else {
          // Set new sort (replacing any existing sort)
          onSort([{ columnKey, direction: "asc" as const }]);
        }
      },
      [sortConfigs, onSort],
    );

    // Column renderer using accessor
    const renderColumnValue = useCallback((item: Item, column: TableColumn) => {
      return column.accessor(item);
    }, []);

    // Header component
    const renderHeader = useCallback(
      () => (
        <View style={styles.headerWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={tableWidth > availableWidth}
            style={StyleSheet.flatten([
              styles.headerContainer,
              {
                backgroundColor: isDark ? extendedColors.neutral[800] : extendedColors.neutral[100],
                borderBottomColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200],
              },
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
          >
            <View style={StyleSheet.flatten([styles.headerRow, { width: tableWidth }])}>
              {showSelection && (
                <View style={StyleSheet.flatten([styles.headerCell, styles.checkboxCell])}>
                  <Checkbox checked={items.length > 0 && items.every((item) => selectedItems.has(item.id))} onCheckedChange={handleSelectAll} disabled={items.length === 0} />
                </View>
              )}
              {displayColumns.map((column) => {
                const sortConfig = sortConfigs?.find((config) => config.columnKey === column.key);

                return (
                  <TouchableOpacity
                    key={column.key}
                    style={StyleSheet.flatten([styles.headerCell, { width: column.width }])}
                    onPress={() => column.sortable && handleSort(column.key)}
                    disabled={!column.sortable}
                    activeOpacity={column.sortable ? 0.7 : 1}
                  >
                    <View style={styles.headerCellContent}>
                      <View style={styles.headerTextContainer}>
                        <ThemedText
                          style={StyleSheet.flatten([styles.headerText, { color: isDark ? extendedColors.neutral[200] : "#000000" }])}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {column.header}
                        </ThemedText>
                      </View>
                      {column.sortable && (
                        <View style={styles.sortIconWrapper}>
                          {sortConfig ? (
                            <View style={styles.sortIconContainer}>
                              {sortConfig.direction === "asc" ? (
                                <Icon name="chevron-up" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                              ) : (
                                <Icon name="chevron-down" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                              )}
                            </View>
                          ) : (
                            <IconSelector size={16} color={isDark ? extendedColors.neutral[400] : extendedColors.neutral[600]} />
                          )}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      ),
      [colors, isDark, tableWidth, displayColumns, showSelection, selectedItems, items.length, sortConfigs, handleSelectAll, handleSort],
    );

    // Row component
    const renderRow = useCallback(
      ({ item, index }: { item: Item; index: number }) => {
        const isSelected = selectedItems.has(item.id);
        const isEven = index % 2 === 0;

        if (enableSwipeActions && (onItemEdit || onItemDelete)) {
          return (
            <ItemTableRowSwipe key={item.id} itemId={item.id} itemName={item.name} onEdit={onItemEdit} onDelete={onItemDelete} disabled={showSelection}>
              {(isActive) => (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={tableWidth > availableWidth}
                  style={StyleSheet.flatten([
                    styles.row,
                    {
                      backgroundColor: isEven ? colors.background : isDark ? extendedColors.neutral[900] : extendedColors.neutral[50],
                      borderBottomColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200],
                    },
                    isSelected && { backgroundColor: colors.primary + "20" },
                  ])}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  <Pressable
                    style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])}
                    onPress={() => onItemPress?.(item.id)}
                    onLongPress={() => showSelection && handleSelectItem(item.id)}
                    android_ripple={{ color: colors.primary + "20" }}
                  >
                    {showSelection && (
                      <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                        <Checkbox checked={isSelected} onCheckedChange={() => handleSelectItem(item.id)} />
                      </View>
                    )}
                    {displayColumns.map((column) => (
                      <View
                        key={column.key}
                        style={StyleSheet.flatten([styles.cell, { width: column.width }, column.align === "center" && styles.centerAlign, column.align === "right" && styles.rightAlign])}
                      >
                        {renderColumnValue(item, column)}
                      </View>
                    ))}
                  </Pressable>
                </ScrollView>
              )}
            </ItemTableRowSwipe>
          );
        }

        // Non-swipeable version
        return (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={tableWidth > availableWidth}
            style={StyleSheet.flatten([
              styles.row,
              {
                backgroundColor: isEven ? colors.background : isDark ? extendedColors.neutral[900] : extendedColors.neutral[50],
                borderBottomColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200],
              },
              isSelected && { backgroundColor: colors.primary + "20" },
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <Pressable
              style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])}
              onPress={() => onItemPress?.(item.id)}
              onLongPress={() => showSelection && handleSelectItem(item.id)}
              android_ripple={{ color: colors.primary + "20" }}
            >
              {showSelection && (
                <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                  <Checkbox checked={isSelected} onCheckedChange={() => handleSelectItem(item.id)} />
                </View>
              )}
              {displayColumns.map((column) => (
                <View
                  key={column.key}
                  style={StyleSheet.flatten([styles.cell, { width: column.width }, column.align === "center" && styles.centerAlign, column.align === "right" && styles.rightAlign])}
                >
                  {renderColumnValue(item, column)}
                </View>
              ))}
            </Pressable>
          </ScrollView>
        );
      },
      [
        colors,
        tableWidth,
        displayColumns,
        showSelection,
        selectedItems,
        onItemPress,
        handleSelectItem,
        renderColumnValue,
        enableSwipeActions,
        onItemEdit,
        onItemDelete,
        activeRowId,
        closeActiveRow,
        isDark,
      ],
    );

    // Loading footer component
    const renderFooter = useCallback(() => {
      if (!loadingMore) return null;

      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando mais...</ThemedText>
        </View>
      );
    }, [loadingMore, colors.primary]);

    // Empty state component
    const renderEmpty = useCallback(
      () => (
        <View style={styles.emptyContainer}>
          <Icon name="archive" size="xl" variant="muted" />
          <ThemedText style={styles.emptyTitle}>Nenhum produto encontrado</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Tente ajustar os filtros ou adicionar novos produtos</ThemedText>
        </View>
      ),
      [colors.mutedForeground],
    );

    // Main loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando produtos...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])} onPress={handleContainerPress}>
          {renderHeader()}
          <FlatList
            ref={flatListRef}
            data={items}
            renderItem={renderRow}
            keyExtractor={(item) => item.id}
            refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.2}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={15}
            updateCellsBatchingPeriod={50}
            getItemLayout={(data, index) => ({
              length: 60, // Fixed row height
              offset: 60 * index,
              index,
            })}
            style={styles.flatList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </Pressable>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 16,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerWrapper: {
    flexDirection: "column",
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
  },
  headerCell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    minHeight: 40,
    justifyContent: "center",
  },
  headerText: {
    fontSize: 10, // Smaller than xs to prevent line breaks
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    lineHeight: 12,
    color: "#000000", // black text like web
  },
  nonSortableHeader: {
    opacity: 1,
  },
  sortIcon: {
    marginLeft: spacing.xs,
  },
  headerCellContent: {
    display: "flex",
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 4,
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0, // Allow text to shrink below content size
  },
  sortIconWrapper: {
    flexShrink: 0, // Prevent icon from shrinking
    justifyContent: "center",
    alignItems: "center",
    width: 16,
  },
  sortIndicator: {
    marginLeft: 4,
  },
  sortIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortOrder: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    marginLeft: 2,
  },
  checkboxCell: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  flatList: {
    flex: 1,
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5", // neutral-200
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "stretch", // Changed from 'center' to 'stretch' to ensure all cells have same height
    minHeight: 36,
  },
  cell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
    justifyContent: "center",
    minHeight: 36,
  },
  centerAlign: {
    alignItems: "center",
  },
  rightAlign: {
    alignItems: "flex-end",
  },
  cellText: {
    fontSize: fontSize.xs,
  },
  monoText: {
    fontFamily: "monospace",
    fontSize: fontSize.xs, // Smaller for codes
  },
  nameText: {
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs,
  },
  numberText: {
    fontWeight: fontWeight.normal,
    fontSize: fontSize.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  quantityCell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
    height: "100%", // Ensure it takes full height of parent cell
  },
  quantityText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  consumptionCell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    minWidth: 0,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  trendText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  abcXyzContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
});

ItemTable.displayName = "ItemTable";
