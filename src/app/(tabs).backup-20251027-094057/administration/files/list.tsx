import React, { useState, useCallback, useMemo } from "react";
import { View, ActivityIndicator, Pressable, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconPlus, IconFilter, IconUpload, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFileMutations } from '../../../../hooks';
import { useFilesInfiniteMobile } from "@/hooks";
import type { FileGetManyFormData } from '../../../../schemas';
import type { File } from '../../../../types/file';
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, ListActionButton } from "@/components/ui";
import { FileTable } from "@/components/administration/file/list/file-table";
import type { SortConfig } from "@/lib/sort-utils";
import { FileFilterTags } from "@/components/administration/file/list/file-filter-tags";
import { FilePreviewModal } from "@/components/file/file-preview-modal";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { FileListSkeleton } from "@/components/administration/file/skeleton/file-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { getFileUrl } from '../../../../utils';

// New hooks and components
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { BaseFilterDrawer, MultiSelectFilter, NumericRangeFilter, DateRangeFilter } from "@/components/common/filters";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Common MIME type presets
const COMMON_MIME_TYPES = [
  { value: "image/*", label: "Imagens" },
  { value: "application/pdf", label: "PDF" },
  { value: "application/vnd.ms-excel", label: "Excel" },
  { value: "application/msword", label: "Word" },
  { value: "video/*", label: "Vídeos" },
  { value: "audio/*", label: "Áudio" },
];

export default function FileListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [previewFileIndex, setPreviewFileIndex] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<{
    mimeTypes?: string[];
    sizeRange?: { min?: number; max?: number };
    createdDateRange?: { from?: Date; to?: Date };
    updatedDateRange?: { from?: Date; to?: Date };
  }>({});

  // Use new hooks
  const { displayText, searchText, setDisplayText } = useDebouncedSearch("", 300);

  const { sortConfigs, handleSort, buildOrderBy } = useTableSort(
    [{ columnKey: "createdAt", direction: "asc", order: 0 }],
    3,
    false
  );

  const {
    visibleColumns,
    setVisibleColumns,
    isLoading: isColumnsLoading,
  } = useColumnVisibility(
    "files",
    ["filename", "mimetype", "size", "createdAt"],
    ["filename", "mimetype", "size", "createdAt", "updatedAt"]
  );

  // Build API query
  const buildWhereClause = useCallback(() => {
    const where: any = {};

    if (filters.mimeTypes?.length) {
      where.mimetype = { in: filters.mimeTypes };
    }

    if (filters.sizeRange?.min !== undefined || filters.sizeRange?.max !== undefined) {
      where.size = {
        ...(filters.sizeRange.min !== undefined ? { gte: filters.sizeRange.min * 1024 } : {}), // Convert KB to bytes
        ...(filters.sizeRange.max !== undefined ? { lte: filters.sizeRange.max * 1024 } : {}),
      };
    }

    return Object.keys(where).length > 0 ? where : undefined;
  }, [filters]);

  const queryParams = useMemo(() => ({
    orderBy: buildOrderBy(
      {
        filename: "filename",
        mimetype: "mimetype",
        size: "size",
        createdAt: "createdAt",
        updatedAt: "updatedAt",
      },
      { createdAt: "desc" }
    ),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...(buildWhereClause() ? { where: buildWhereClause() } : {}),
    ...(filters.createdDateRange?.from || filters.createdDateRange?.to ? {
      createdAt: {
        ...(filters.createdDateRange.from && { gte: filters.createdDateRange.from }),
        ...(filters.createdDateRange.to && { lte: filters.createdDateRange.to }),
      },
    } : {}),
    ...(filters.updatedDateRange?.from || filters.updatedDateRange?.to ? {
      updatedAt: {
        ...(filters.updatedDateRange.from && { gte: filters.updatedDateRange.from }),
        ...(filters.updatedDateRange.to && { lte: filters.updatedDateRange.to }),
      },
    } : {}),
    include: {},
  }), [searchText, buildWhereClause, buildOrderBy, filters]);

  const { items: files, isLoading, error, refetch, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, totalCount, refresh } = useFilesInfiniteMobile(queryParams);
  const { delete: deleteFile } = useFileMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleUpload = () => {
    router.push(routeToMobilePath(routes.administration.files.upload) as any);
  };

  const handleFilePress = (fileId: string) => {
    const fileIndex = files.findIndex((f: File) => f.id === fileId);
    if (fileIndex !== -1) {
      setPreviewFileIndex(fileIndex);
      setShowPreview(true);
    }
  };

  const handleFilePreview = (fileId: string) => {
    handleFilePress(fileId);
  };

  const handleFileDelete = useCallback(
    async (fileId: string) => {
      await deleteFile(fileId);
      if (selectedFiles.has(fileId)) {
        const newSelection = new Set(selectedFiles);
        newSelection.delete(fileId);
        setSelectedFiles(newSelection);
      }
    },
    [deleteFile, selectedFiles],
  );

  const handleFileShare = useCallback(
    async (fileId: string) => {
      try {
        const file = files.find((f: File) => f.id === fileId);
        if (!file) return;

        const fileUrl = getFileUrl(file, "");
        const fileUri = FileSystem.cacheDirectory + file.filename;

        // Download to cache
        const { uri } = await FileSystem.downloadAsync(fileUrl, fileUri);

        // Share file
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: file.mimetype,
            dialogTitle: "Compartilhar arquivo",
          });
        } else {
          Alert.alert("Erro", "Compartilhamento não disponível neste dispositivo.");
        }
      } catch (error) {
        console.error("Error sharing file:", error);
        Alert.alert("Erro", "Não foi possível compartilhar o arquivo.");
      }
    },
    [files],
  );

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedFiles(newSelection);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setDisplayText("");
    setSelectedFiles(new Set());
    setShowSelection(false);
  }, [setDisplayText]);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumns(Array.from(newColumns));
  }, [setVisibleColumns]);

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(
    (value) => {
      if (value === undefined || value === null) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object") {
        // Check ranges (size, date)
        return Object.values(value).some(v => v !== undefined && v !== null);
      }
      return true;
    }
  ).length;

  // Toggle MIME type selection
  const toggleMimeType = useCallback((mimeType: string) => {
    setFilters(prev => {
      const current = prev.mimeTypes || [];
      const updated = current.includes(mimeType)
        ? current.filter(m => m !== mimeType)
        : [...current, mimeType];
      return {
        ...prev,
        mimeTypes: updated.length > 0 ? updated : undefined,
      };
    });
  }, []);

  // MIME type options
  const mimeTypeOptions = useMemo(() =>
    COMMON_MIME_TYPES.map(type => ({
      value: type.value,
      label: type.label,
    })),
    []
  );

  // Filter sections for BaseFilterDrawer
  const filterSections = useMemo(() => [
    {
      id: "mimeTypes",
      title: "Tipo de Arquivo",
      defaultOpen: true,
      badge: filters.mimeTypes?.length || 0,
      content: (
        <View>
          <ThemedText style={{ fontSize: 14, marginBottom: 8, color: colors.mutedForeground }}>
            Selecione os tipos de arquivo:
          </ThemedText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {COMMON_MIME_TYPES.map((type) => (
              <Pressable
                key={type.value}
                onPress={() => toggleMimeType(type.value)}
              >
                <Badge
                  variant={filters.mimeTypes?.includes(type.value) ? "default" : "outline"}
                  style={{ paddingHorizontal: 12, paddingVertical: 6 }}
                >
                  <ThemedText style={[
                    { fontSize: 14 },
                    filters.mimeTypes?.includes(type.value) && { color: colors.primaryForeground }
                  ]}>
                    {type.label}
                  </ThemedText>
                </Badge>
              </Pressable>
            ))}
          </View>
        </View>
      ),
    },
    {
      id: "size",
      title: "Tamanho",
      defaultOpen: false,
      badge: (filters.sizeRange?.min !== undefined || filters.sizeRange?.max !== undefined) ? 1 : 0,
      content: (
        <NumericRangeFilter
          label="Tamanho (KB)"
          value={filters.sizeRange}
          onChange={(range) => setFilters(prev => ({ ...prev, sizeRange: range }))}
          suffix=" KB"
          decimalPlaces={0}
        />
      ),
    },
    {
      id: "dates",
      title: "Datas",
      defaultOpen: false,
      badge: (filters.createdDateRange?.from || filters.createdDateRange?.to ? 1 : 0) + (filters.updatedDateRange?.from || filters.updatedDateRange?.to ? 1 : 0),
      content: (
        <>
          <DateRangeFilter
            label="Data de Criação"
            value={filters.createdDateRange}
            onChange={(range) => setFilters(prev => ({ ...prev, createdDateRange: range }))}
            showPresets={true}
          />
          <DateRangeFilter
            label="Data de Atualização"
            value={filters.updatedDateRange}
            onChange={(range) => setFilters(prev => ({ ...prev, updatedDateRange: range }))}
            showPresets={true}
          />
        </>
      ),
    },
  ], [filters, colors, toggleMimeType]);

  if (isLoading && !isRefetching) {
    return <FileListSkeleton />;
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar arquivos" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasFiles = Array.isArray(files) && files.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search, Filter and Sort */}
      <View style={[styles.searchContainer]}>
        <Input
          value={displayText}
          onChangeText={setDisplayText}
          placeholder="Buscar arquivos..."
          style={styles.searchBar}
        />
        <View style={styles.buttonContainer}>
          <ListActionButton
            icon={<IconList size={20} color={colors.foreground} />}
            onPress={() => setShowColumnManager(true)}
            badgeCount={visibleColumns.length}
            badgeVariant="primary"
          />
          <ListActionButton
            icon={<IconFilter size={20} color={colors.foreground} />}
            onPress={() => setShowFilters(true)}
            badgeCount={activeFiltersCount}
            badgeVariant="destructive"
            showBadge={activeFiltersCount > 0}
          />
        </View>
      </View>

      {/* Individual filter tags */}
      <FileFilterTags
        filters={queryParams}
        searchText={searchText}
        onFilterChange={(newFilters) => {
          const where = newFilters.where as any;
          if (where?.mimetype?.in) {
            setFilters(prev => ({ ...prev, mimeTypes: where.mimetype.in }));
          }
          if (where?.size) {
            setFilters(prev => ({ ...prev, sizeRange: {
              min: where.size.gte ? where.size.gte / 1024 : undefined,
              max: where.size.lte ? where.size.lte / 1024 : undefined,
            }}));
          }
          if (newFilters.createdAt) {
            setFilters(prev => ({ ...prev, createdDateRange: {
              from: newFilters.createdAt?.gte,
              to: newFilters.createdAt?.lte
            }}));
          }
          if (newFilters.updatedAt) {
            setFilters(prev => ({ ...prev, updatedDateRange: {
              from: newFilters.updatedAt?.gte,
              to: newFilters.updatedAt?.lte
            }}));
          }
        }}
        onSearchChange={(text) => {
          setDisplayText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasFiles ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <FileTable
            files={files}
            onFilePress={handleFilePress}
            onFilePreview={handleFilePreview}
            onFileDelete={handleFileDelete}
            onFileShare={handleFileShare}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing}
            loading={isLoading && !isRefetching}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedFiles={selectedFiles}
            onSelectionChange={handleSelectionChange}
            sortConfigs={sortConfigs}
            onSort={(configs) => handleSort(configs[0]?.columnKey || "createdAt")}
            enableSwipeActions={true}
          />
        </TableErrorBoundary>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "file"}
            title={searchText ? "Nenhum arquivo encontrado" : "Nenhum arquivo"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece fazendo upload de arquivos"}
            actionLabel={searchText ? undefined : "Fazer Upload"}
            onAction={searchText ? undefined : handleUpload}
          />
        </View>
      )}

      {/* Items count */}
      {hasFiles && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}

      {hasFiles && <FAB icon="upload" onPress={handleUpload} />}

      {/* New BaseFilterDrawer */}
      <BaseFilterDrawer
        open={showFilters}
        onOpenChange={setShowFilters}
        sections={filterSections}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
        title="Filtros de Arquivos"
        description="Configure os filtros para refinar sua busca"
      />

      {/* File Preview Modal */}
      {showPreview && previewFileIndex !== null && (
        <FilePreviewModal
          files={files}
          initialFileIndex={previewFileIndex}
          visible={showPreview}
          onClose={() => {
            setShowPreview(false);
            setPreviewFileIndex(null);
          }}
          baseUrl=""
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
