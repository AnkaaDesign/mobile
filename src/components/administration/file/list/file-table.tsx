import React, { useState, useCallback, useMemo, useRef } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet, Alert, Share } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { File } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { ReanimatedSwipeableRow } from "@/components/ui/reanimated-swipeable-row";
import { FileTypeIcon } from "@/components/ui/file-type-icon";
import { formatFileSize, formatDateTime } from '../../../../utils';
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";
import type { SortConfig } from "@/lib/sort-utils";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (file: File) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}


interface FileTableProps {
  files: File[];
  onFilePress?: (fileId: string) => void;
  onFilePreview?: (fileId: string) => void;
  onFileDelete?: (fileId: string) => void;
  onFileShare?: (fileId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedFiles?: Set<string>;
  onSelectionChange?: (selectedFiles: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  enableSwipeActions?: boolean;
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32;

// Define all available columns with their renderers
const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "filename",
    header: "Arquivo",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (file: File) => (
      <View style={styles.fileCell}>
        <FileTypeIcon filename={file.filename} mimeType={file.mimetype} size="md" />
        <View style={styles.fileNameContainer}>
          <ThemedText style={StyleSheet.flatten([styles.cellText, styles.nameText])} numberOfLines={1}>
            {file.filename}
          </ThemedText>
          <ThemedText style={styles.subtitleText} numberOfLines={1}>
            {file.originalName}
          </ThemedText>
        </View>
      </View>
    ),
  },
  {
    key: "mimetype",
    header: "Tipo",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (file: File) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {file.mimetype.split("/")[1]?.toUpperCase() || file.mimetype}
      </ThemedText>
    ),
  },
  {
    key: "size",
    header: "Tamanho",
    align: "right",
    sortable: true,
    width: 0,
    accessor: (file: File) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])} numberOfLines={1}>
        {formatFileSize(file.size)}
      </ThemedText>
    ),
  },
  {
    key: "createdAt",
    header: "Enviado em",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (file: File) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {formatDateTime(file.createdAt)}
      </ThemedText>
    ),
  },
];

export const FileTable = React.memo<FileTableProps>(
  ({
    files,
    onFilePress,
    onFilePreview,
    onFileDelete,
    onFileShare,
    onRefresh,
    onEndReached,
    refreshing = false,
    loading = false,
    loadingMore = false,
    showSelection = false,
    selectedFiles = new Set(),
    onSelectionChange,
    sortConfigs = [],
    onSort,
    enableSwipeActions = true,
  }) => {
    const { colors, isDark } = useTheme();
    const { activeRowId, closeActiveRow } = useSwipeRow();
    const [headerHeight, setHeaderHeight] = useState(50);
    const flatListRef = useRef<FlatList>(null);

    // Get all column definitions
    const allColumns = useMemo(() => createColumnDefinitions(), []);

    // Build visible columns with dynamic widths
    const displayColumns = useMemo(() => {
      // Define width ratios for each column type
      const columnWidthRatios: Record<string, number> = {
        filename: 3.0,
        mimetype: 1.0,
        size: 1.0,
        createdAt: 1.5,
      };

      // Calculate total ratio
      const totalRatio = allColumns.reduce((sum, col) => sum + (columnWidthRatios[col.key] || 1.0), 0);

      // Calculate actual widths
      return allColumns.map((col) => {
        const ratio = columnWidthRatios[col.key] || 1.0;
        const width = Math.floor((availableWidth * ratio) / totalRatio);
        return { ...col, width };
      });
    }, [allColumns]);

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
      if (showSelection) width += 50;
      return width;
    }, [displayColumns, showSelection]);

    // Selection handlers
    const handleSelectAll = useCallback(() => {
      if (!onSelectionChange) return;

      const allSelected = files.every((file) => selectedFiles.has(file.id));
      if (allSelected) {
        onSelectionChange(new Set());
      } else {
        onSelectionChange(new Set(files.map((file) => file.id)));
      }
    }, [files, selectedFiles, onSelectionChange]);

    const handleSelectFile = useCallback(
      (fileId: string) => {
        if (!onSelectionChange) return;

        const newSelection = new Set(selectedFiles);
        if (newSelection.has(fileId)) {
          newSelection.delete(fileId);
        } else {
          newSelection.add(fileId);
        }
        onSelectionChange(newSelection);
      },
      [selectedFiles, onSelectionChange],
    );

    // Sort handler
    const handleSort = useCallback(
      (columnKey: string) => {
        if (!onSort) return;

        const existingIndex = sortConfigs?.findIndex((config) => config.columnKey === columnKey) ?? -1;

        if (existingIndex !== -1) {
          const newConfigs = [...(sortConfigs || [])];
          if (newConfigs[existingIndex].direction === "asc") {
            newConfigs[existingIndex].direction = "desc";
          } else {
            newConfigs.splice(existingIndex, 1);
          }
          onSort(newConfigs);
        } else {
          const newConfigs = [{ columnKey, direction: "asc" as const }, ...(sortConfigs || [])];
          if (newConfigs.length > 3) {
            newConfigs.pop();
          }
          onSort(newConfigs);
        }
      },
      [sortConfigs, onSort],
    );

    // Column renderer using accessor
    const renderColumnValue = useCallback((file: File, column: TableColumn) => {
      return column.accessor(file);
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
                  <Checkbox checked={files.length > 0 && files.every((file) => selectedFiles.has(file.id))} onCheckedChange={handleSelectAll} disabled={files.length === 0} />
                </View>
              )}
              {displayColumns.map((column) => {
                const sortIndex = sortConfigs?.findIndex((config) => config.columnKey === column.key) ?? -1;
                const sortConfig = sortIndex !== -1 ? sortConfigs[sortIndex] : null;

                return (
                  <TouchableOpacity
                    key={column.key}
                    style={StyleSheet.flatten([styles.headerCell, { width: column.width }])}
                    onPress={() => column.sortable && handleSort(column.key)}
                    onLongPress={() => {
                      if (column.sortable && sortConfig) {
                        const newSorts = sortConfigs.filter((config) => config.columnKey !== column.key);
                        onSort?.(newSorts);
                      }
                    }}
                    disabled={!column.sortable}
                    activeOpacity={column.sortable ? 0.7 : 1}
                  >
                    <View style={styles.headerCellContent}>
                      <ThemedText style={StyleSheet.flatten([styles.headerText, { color: isDark ? extendedColors.neutral[200] : "#000000" }])} numberOfLines={1}>
                        {column.header}
                      </ThemedText>
                      {column.sortable &&
                        (sortConfig ? (
                          <View style={styles.sortIconContainer}>
                            {sortConfig.direction === "asc" ? (
                              <Icon name="chevron-up" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                            ) : (
                              <Icon name="chevron-down" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                            )}
                            {sortConfigs.length > 1 && (
                              <ThemedText style={StyleSheet.flatten([styles.sortOrder, { color: isDark ? extendedColors.neutral[300] : extendedColors.neutral[700] }])}>{sortIndex + 1}</ThemedText>
                            )}
                          </View>
                        ) : (
                          <Icon name="arrows-sort" size="sm" color={isDark ? extendedColors.neutral[400] : extendedColors.neutral[600]} />
                        ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      ),
      [colors, isDark, tableWidth, displayColumns, showSelection, selectedFiles, files.length, sortConfigs, handleSelectAll, handleSort],
    );

    // Row component with swipe actions
    const renderRow = useCallback(
      ({ item: file, index }: { item: File; index: number }) => {
        const isSelected = selectedFiles.has(file.id);
        const isEven = index % 2 === 0;

        const rowContent = (
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
              onPress={() => onFilePress?.(file.id)}
              onLongPress={() => showSelection && handleSelectFile(file.id)}
              android_ripple={{ color: colors.primary + "20" }}
            >
              {showSelection && (
                <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                  <Checkbox checked={isSelected} onCheckedChange={() => handleSelectFile(file.id)} />
                </View>
              )}
              {displayColumns.map((column) => (
                <View
                  key={column.key}
                  style={StyleSheet.flatten([styles.cell, { width: column.width }, column.align === "center" && styles.centerAlign, column.align === "right" && styles.rightAlign])}
                >
                  {renderColumnValue(file, column)}
                </View>
              ))}
            </Pressable>
          </ScrollView>
        );

        if (enableSwipeActions && (onFilePreview || onFileDelete || onFileShare)) {
          const actions = [];

          if (onFilePreview) {
            actions.push({
              icon: "eye" as const,
              label: "Visualizar",
              backgroundColor: badgeColors.info.background,
              onPress: () => onFilePreview(file.id),
            });
          }

          if (onFileShare) {
            actions.push({
              icon: "share" as const,
              label: "Compartilhar",
              backgroundColor: badgeColors.warning.background,
              onPress: () => onFileShare(file.id),
            });
          }

          if (onFileDelete) {
            actions.push({
              icon: "trash" as const,
              label: "Deletar",
              backgroundColor: badgeColors.error.background,
              onPress: () => {
                Alert.alert("Confirmar exclusão", `Deseja realmente excluir o arquivo "${file.filename}"?`, [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Excluir",
                    style: "destructive",
                    onPress: () => onFileDelete(file.id),
                  },
                ]);
              },
            });
          }

          return (
            <ReanimatedSwipeableRow
              key={file.id}
              rightActions={actions.map(action => ({
                key: action.label,
                label: action.label,
                icon: <Icon name={action.icon} size="sm" color="#ffffff" />,
                backgroundColor: action.backgroundColor,
                onPress: action.onPress
              }))}
              enabled={!showSelection}
            >
              {rowContent}
            </ReanimatedSwipeableRow>
          );
        }

        return <View key={file.id}>{rowContent}</View>;
      },
      [
        colors,
        tableWidth,
        displayColumns,
        showSelection,
        selectedFiles,
        onFilePress,
        handleSelectFile,
        renderColumnValue,
        enableSwipeActions,
        onFilePreview,
        onFileDelete,
        onFileShare,
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
          <Icon name="file-off" size="xl" variant="muted" />
          <ThemedText style={styles.emptyTitle}>Nenhum arquivo encontrado</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Tente ajustar os filtros ou fazer upload de novos arquivos</ThemedText>
        </View>
      ),
      [],
    );

    // Main loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando arquivos...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])} onPress={handleContainerPress}>
          {renderHeader()}
          <FlatList
            ref={flatListRef}
            data={files}
            renderItem={renderRow}
            keyExtractor={(file) => file.id}
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
              length: 36,
              offset: 36 * index,
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
    fontSize: 10,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    lineHeight: 12,
    color: "#000000",
  },
  headerCellContent: {
    display: "flex",
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  sortIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
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
    borderBottomColor: "#e5e5e5",
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "stretch",
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
  nameText: {
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs,
  },
  numberText: {
    fontWeight: fontWeight.normal,
    fontSize: fontSize.xs,
  },
  subtitleText: {
    fontSize: fontSize.xs,
    opacity: 0.7,
    marginTop: 2,
  },
  fileCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fileNameContainer: {
    flex: 1,
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
});

FileTable.displayName = "FileTable";
