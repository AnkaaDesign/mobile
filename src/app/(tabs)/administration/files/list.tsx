import React, { useState, useCallback } from "react";
import { View, ActivityIndicator, Pressable, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconPlus, IconFilter, IconUpload } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFileMutations } from '../../../../hooks';
import { useFilesInfiniteMobile } from "@/hooks";
import type { FileGetManyFormData } from '../../../../schemas';
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, SearchBar, Badge } from "@/components/ui";
import { FileTable } from "@/components/administration/file/list/file-table";
import type { SortConfig } from "@/components/administration/file/list/file-table";
import { FileFilterModal } from "@/components/administration/file/list/file-filter-modal";
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

export default function FileListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<FileGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "createdAt", direction: "desc" }]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [previewFileIndex, setPreviewFileIndex] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { createdAt: "desc" };

    if (sortConfigs.length === 1) {
      const config = sortConfigs[0];
      switch (config.columnKey) {
        case "filename":
          return { filename: config.direction };
        case "mimetype":
          return { mimetype: config.direction };
        case "size":
          return { size: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "updatedAt":
          return { updatedAt: config.direction };
        default:
          return { createdAt: "desc" };
      }
    }

    return sortConfigs.map((config) => {
      switch (config.columnKey) {
        case "filename":
          return { filename: config.direction };
        case "mimetype":
          return { mimetype: config.direction };
        case "size":
          return { size: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "updatedAt":
          return { updatedAt: config.direction };
        default:
          return { createdAt: "desc" };
      }
    });
  };

  const queryParams = {
    orderBy: buildOrderBy(),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
    include: {},
  };

  const { items: files, isLoading, error, refetch, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, refresh } = useFilesInfiniteMobile(queryParams);
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
    const fileIndex = files.findIndex((f) => f.id === fileId);
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
      try {
        await deleteFile(fileId);
        if (selectedFiles.has(fileId)) {
          const newSelection = new Set(selectedFiles);
          newSelection.delete(fileId);
          setSelectedFiles(newSelection);
        }
      } catch (error) {
        Alert.alert("Erro", "Não foi possível excluir o arquivo. Tente novamente.");
      }
    },
    [deleteFile, selectedFiles],
  );

  const handleFileShare = useCallback(
    async (fileId: string) => {
      try {
        const file = files.find((f) => f.id === fileId);
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

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedFiles(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<FileGetManyFormData>) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedFiles(new Set());
    setShowSelection(false);
  }, []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true)).length;

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
        <SearchBar value={displaySearchText} onChangeText={handleDisplaySearchChange} onSearch={handleSearch} placeholder="Buscar arquivos..." style={styles.searchBar} debounceMs={300} />
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              },
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => setShowFilters(true)}
          >
            <IconFilter size={24} color={colors.foreground} />
            {activeFiltersCount > 0 && (
              <Badge style={styles.actionBadge} variant="destructive" size="sm">
                <ThemedText style={StyleSheet.flatten([styles.actionBadgeText, { color: "white" }])}>{activeFiltersCount}</ThemedText>
              </Badge>
            )}
          </Pressable>
        </View>
      </View>

      {/* Individual filter tags */}
      <FileFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleApplyFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
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
            onSort={handleSort}
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
      {hasFiles && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={undefined} isLoading={isFetchingNextPage} />}

      {hasFiles && <FAB icon="upload" onPress={handleUpload} />}

      {/* Filter Modal */}
      <FileFilterModal visible={showFilters} onClose={() => setShowFilters(false)} onApply={handleApplyFilters} currentFilters={filters} />

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
  actionButton: {
    height: 48,
    width: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  actionBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  actionBadgeText: {
    fontSize: 9,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
});
