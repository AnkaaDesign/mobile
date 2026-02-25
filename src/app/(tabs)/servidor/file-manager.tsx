import { useState, useCallback, useEffect, useMemo } from "react";
import { View, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from "react-native";
import { Text } from "@/components/ui/text";
import { ThemedView } from "@/components/ui/themed-view";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useSharedFolders, useSharedFolderContents } from "@/hooks/useServer";
import { Icon } from "@/components/ui/icon";
import { SearchBar } from "@/components/ui/search-bar";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useTheme } from "@/lib/theme";
import { FileViewerProvider, useFileViewer } from "@/components/file/file-viewer";
import { FileItem } from "@/components/file/file-item";
import { IconList, IconLayoutGrid } from "@tabler/icons-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { File as AnkaaFile } from "@/types";

// ============================================================
// Constants
// ============================================================

const VIEW_MODE_STORAGE_KEY = "@file_manager_view_mode";
const SCREEN_WIDTH = Dimensions.get("window").width;
const GRID_PADDING = 16;
const GRID_GAP = 10;
const GRID_NUM_COLUMNS = 2;
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (GRID_NUM_COLUMNS - 1)) / GRID_NUM_COLUMNS;

type FileViewMode = "grid" | "list";

// ============================================================
// Utility Functions
// ============================================================

// Parse remote size string to bytes (e.g., "1.2G" -> bytes)
function parseRemoteSize(sizeStr: string): number {
  if (!sizeStr || sizeStr === "-" || sizeStr === "0") return 0;
  const match = sizeStr.match(/^(\d+\.?\d*)\s*([KMGT]?)B?$/i);
  if (!match) return 0;
  const [, numStr, unit] = match;
  const num = parseFloat(numStr);
  const multipliers: Record<string, number> = {
    "": 1,
    "K": 1024,
    "M": 1024 * 1024,
    "G": 1024 * 1024 * 1024,
    "T": 1024 * 1024 * 1024 * 1024,
  };
  return Math.floor(num * (multipliers[unit.toUpperCase()] || 1));
}

// Format a remote size string for display (e.g., "1234567890" -> "1.15 GB")
function formatRemoteFileSize(size: string): string {
  const match = size.match(/^(\d+\.?\d*)\s*([KMGT]?)B?$/i);
  if (!match) return size;
  const [, sizeNum, unit] = match;
  const unitMap: Record<string, string> = {
    "": "B",
    K: "KB",
    M: "MB",
    G: "GB",
    T: "TB",
  };
  return `${sizeNum} ${unitMap[unit.toUpperCase()] || unit}`;
}

// Convert a remote storage item to AnkaaFile format for the file viewer
function convertRemoteItemToAnkaaFile(
  item: {
    name: string;
    type: "file" | "directory";
    size: string;
    lastModified: Date;
    remoteUrl?: string;
    webdavUrl?: string;
    // Database file fields (when matched)
    dbFileId?: string;
    dbFilePath?: string;
    dbThumbnailUrl?: string | null;
    dbMimeType?: string;
    dbFileSize?: number;
  },
  folderPath: string
): AnkaaFile {
  const extension = item.name.split(".").pop()?.toLowerCase() || "";
  let mimetype = "application/octet-stream";

  if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(extension)) {
    mimetype = `image/${extension === "jpg" ? "jpeg" : extension}`;
  } else if (["mp4", "webm", "ogg", "mov", "avi"].includes(extension)) {
    mimetype = `video/${extension}`;
  } else if (extension === "pdf") {
    mimetype = "application/pdf";
  } else if (["doc", "docx"].includes(extension)) {
    mimetype = "application/msword";
  } else if (["xls", "xlsx"].includes(extension)) {
    mimetype = "application/vnd.ms-excel";
  } else if (["mp3"].includes(extension)) {
    mimetype = "audio/mpeg";
  } else if (["wav"].includes(extension)) {
    mimetype = "audio/wav";
  } else if (["flac"].includes(extension)) {
    mimetype = "audio/flac";
  } else if (["aac"].includes(extension)) {
    mimetype = "audio/aac";
  } else if (["m4a"].includes(extension)) {
    mimetype = "audio/m4a";
  } else if (["eps"].includes(extension)) {
    mimetype = "application/postscript";
  }

  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(extension);

  // Use database file info when available (enables proper thumbnails and inline viewing)
  if (item.dbFileId) {
    return {
      id: item.dbFileId,
      filename: item.name,
      originalName: item.name,
      mimetype: item.dbMimeType || mimetype,
      path: item.dbFilePath || item.remoteUrl || "",
      size: item.dbFileSize || parseRemoteSize(item.size),
      thumbnailUrl: item.dbThumbnailUrl || (isImage && item.remoteUrl ? item.remoteUrl : null),
      createdAt: item.lastModified,
      updatedAt: item.lastModified,
    } as AnkaaFile;
  }

  // Fallback for files without database records
  const remoteUrl = item.remoteUrl || item.webdavUrl || "";

  return {
    id: `remote-${folderPath}-${item.name}`,
    filename: item.name,
    originalName: item.name,
    mimetype,
    path: remoteUrl,
    size: parseRemoteSize(item.size),
    // Only set thumbnailUrl for images - PDFs from remote storage can't use backend thumbnail generator
    thumbnailUrl: isImage && remoteUrl ? remoteUrl : null,
    createdAt: item.lastModified,
    updatedAt: item.lastModified,
  } as AnkaaFile;
}

// Check if a file can be previewed in-app (images, PDFs, videos)
function isPreviewableFile(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)) return true;
  if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return true;
  if (ext === "pdf") return true;
  return false;
}

// Derive folder type from folder name (matching web implementation)
function deriveFolderType(folderName: string, providedType?: string): string {
  if (providedType && providedType !== "other") return providedType;

  const name = folderName.toLowerCase();

  if (name.includes("projeto") || name === "projetos") return "projects";
  if (name.includes("orcamento") || name.includes("orçamento")) return "budgets";
  if (name.includes("observa")) return "observations";
  if (name.includes("nota") || name.includes("fiscal") || name.includes("invoice")) return "invoices";
  if (name.includes("logo")) return "logos";
  if (name.includes("plotter") || name.includes("corte")) return "plotter";
  if (name.includes("imagem") || name.includes("imagens") || name.includes("fotos")) return "images";
  if (name.includes("backup")) return "backup";
  if (name.includes("lixeira") || name.includes("trash") || name.includes("excluido")) return "trash";
  if (name.includes("recibo") || name.includes("comprovante")) return "receipts";
  if (name.includes("rascunho") || name.includes("draft")) return "drafts";
  if (name.includes("thumbnail") || name.includes("miniatura")) return "thumbnails";
  if (name.includes("colaborador") || name.includes("funcionario") || name.includes("equipe")) return "team";
  if (name.includes("cliente") || name.includes("customer")) return "customers";
  if (name.includes("fornecedor") || name.includes("supplier")) return "suppliers";
  if (name.includes("aerografia") || name.includes("airbrush")) return "artwork";
  if (name.includes("pdf")) return "documents";
  if (name.includes("outro") || name === "outros") return "misc";
  if (name.includes("tinta") || name.includes("tintas") || name.includes("paint")) return "paints";
  if (name.includes("mensagem") || name.includes("message") || name.includes("whatsapp") || name.includes("chat")) return "messages";
  if (name.includes("layout") || name.includes("design") || name.includes("arte")) return "layouts";

  return "general";
}

// Get folder icon name based on type (matching web implementation)
function getFolderIcon(type?: string): string {
  switch (type) {
    case "artwork": return "palette";
    case "general": return "file-text";
    case "backup": return "archive";
    case "receipts": return "receipt";
    case "images": return "camera";
    case "trash": return "trash";
    case "logos": return "brand-apple";
    case "invoices": return "file-invoice";
    case "observations": return "note";
    case "budgets": return "calculator";
    case "plotter": return "printer";
    case "projects": return "briefcase";
    case "drafts": return "file-text";
    case "thumbnails": return "image";
    case "team": return "users";
    case "customers": return "building";
    case "suppliers": return "truck";
    case "documents": return "file-text";
    case "misc": return "folder";
    case "paints": return "droplet";
    case "messages": return "message";
    case "layouts": return "layout";
    default: return "folder";
  }
}

// ============================================================
// Custom Hook: Persisted View Mode
// ============================================================

function usePersistedViewMode(defaultMode: FileViewMode = "list"): [FileViewMode, (mode: FileViewMode) => void] {
  const [viewMode, setViewModeState] = useState<FileViewMode>(defaultMode);

  useEffect(() => {
    AsyncStorage.getItem(VIEW_MODE_STORAGE_KEY).then((stored) => {
      if (stored === "grid" || stored === "list") {
        setViewModeState(stored);
      }
    }).catch(() => {
      // Ignore errors reading preference
    });
  }, []);

  const setViewMode = useCallback((mode: FileViewMode) => {
    setViewModeState(mode);
    AsyncStorage.setItem(VIEW_MODE_STORAGE_KEY, mode).catch(() => {
      // Ignore errors saving preference
    });
  }, []);

  return [viewMode, setViewMode];
}

// ============================================================
// View Mode Toggle Component
// ============================================================

function ViewModeToggle({
  viewMode,
  onChangeViewMode,
}: {
  viewMode: FileViewMode;
  onChangeViewMode: (mode: FileViewMode) => void;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.muted,
        borderRadius: 8,
        padding: 2,
      }}
    >
      <TouchableOpacity
        style={{
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 6,
          backgroundColor: viewMode === "list" ? colors.primary : "transparent",
        }}
        onPress={() => onChangeViewMode("list")}
        activeOpacity={0.7}
      >
        <IconList size={18} color={viewMode === "list" ? colors.primaryForeground : colors.foreground} />
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 6,
          backgroundColor: viewMode === "grid" ? colors.primary : "transparent",
        }}
        onPress={() => onChangeViewMode("grid")}
        activeOpacity={0.7}
      >
        <IconLayoutGrid size={18} color={viewMode === "grid" ? colors.primaryForeground : colors.foreground} />
      </TouchableOpacity>
    </View>
  );
}

// ============================================================
// Grid Folder Item Component
// ============================================================

function FolderGridItem({
  folder,
  onPress,
}: {
  folder: any;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const folderType = deriveFolderType(folder.name, folder.type);
  const iconName = getFolderIcon(folderType);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        width: GRID_ITEM_WIDTH,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        overflow: "hidden",
      }}
    >
      {/* Icon area */}
      <View
        style={{
          height: 90,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.muted + "30",
        }}
      >
        <Icon name={iconName} size={40} color="#3b82f6" />
      </View>
      {/* Info area */}
      <View
        style={{
          padding: 10,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Text
          style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}
          numberOfLines={1}
        >
          {folder.name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
            {folder.fileCount ?? 0} arquivos
          </Text>
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
            ·
          </Text>
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
            {formatRemoteFileSize(folder.size)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
          <Icon name="calendar" size={11} color={colors.mutedForeground} />
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
            {new Date(folder.lastModified).toLocaleDateString("pt-BR")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ============================================================
// List Folder Item Component
// ============================================================

function FolderListItem({
  folder,
  onPress,
}: {
  folder: any;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const folderType = deriveFolderType(folder.name, folder.type);
  const iconName = getFolderIcon(folderType);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.card,
        borderRadius: 10,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12,
      }}
    >
      <View
        style={{
          backgroundColor: "#3b82f620",
          borderRadius: 10,
          padding: 10,
        }}
      >
        <Icon name={iconName} size={22} color="#3b82f6" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }} numberOfLines={1}>
          {folder.name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 }}>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
            {folder.fileCount ?? 0} arquivos
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
            {folder.subdirCount ?? 0} pastas
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
            {formatRemoteFileSize(folder.size)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
          <Icon name="calendar" size={11} color={colors.mutedForeground} />
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
            {new Date(folder.lastModified).toLocaleDateString("pt-BR")}
          </Text>
        </View>
      </View>
      <Icon name="chevron-right" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

// ============================================================
// Grid Directory Item Component (inside file browser)
// ============================================================

function DirectoryGridItem({
  dir,
  onPress,
}: {
  dir: any;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        width: GRID_ITEM_WIDTH,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: 80,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.muted + "30",
        }}
      >
        <Icon name="folder" size={36} color="#3b82f6" />
      </View>
      <View
        style={{
          padding: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Text
          style={{ fontSize: 12, fontWeight: "500", color: colors.foreground }}
          numberOfLines={2}
        >
          {dir.name}
        </Text>
        {(dir.fileCount !== undefined || dir.folderCount !== undefined) && (
          <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 2 }}>
            {dir.folderCount || 0} pastas, {dir.fileCount || 0} arquivos
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ============================================================
// File Browser Component (browse mode)
// ============================================================

function FileBrowser({
  folderName,
  subPath,
  onNavigate,
  onBack,
  viewMode,
  onChangeViewMode,
}: {
  folderName: string;
  subPath?: string;
  onNavigate: (newSubPath: string) => void;
  onBack: () => void;
  viewMode: FileViewMode;
  onChangeViewMode: (mode: FileViewMode) => void;
}) {
  const { colors } = useTheme();
  const fileViewer = useFileViewer();
  const { data: contents, isLoading, isFetching, refetch } = useSharedFolderContents(folderName, subPath);
  const [searchQuery, setSearchQuery] = useState("");

  // Reset search when navigating to a different path
  useEffect(() => {
    setSearchQuery("");
  }, [subPath]);

  const handleDirectoryPress = useCallback((dirName: string) => {
    const newPath = subPath ? `${subPath}/${dirName}` : dirName;
    onNavigate(newPath);
  }, [subPath, onNavigate]);

  const handleFilePress = useCallback((item: any) => {
    const ankaaFile = convertRemoteItemToAnkaaFile(item, `${folderName}/${subPath || ""}`);

    // Gather all previewable files for unified gallery navigation (matching task detail behavior)
    if (contents?.data?.files) {
      const allPreviewable = contents.data.files
        .filter((f: any) => {
          if (f.type === "directory") return false;
          return isPreviewableFile(f.name);
        })
        .map((f: any) => convertRemoteItemToAnkaaFile(f, `${folderName}/${subPath || ""}`));

      const fileIndex = allPreviewable.findIndex((f: AnkaaFile) => f.id === ankaaFile.id);
      if (fileIndex !== -1) {
        fileViewer.viewFiles(allPreviewable, fileIndex);
        return;
      }
    }

    // Non-previewable files fall back to share/download
    fileViewer.viewFile(ankaaFile);
  }, [folderName, subPath, contents, fileViewer]);

  const handleFileLongPress = useCallback((item: any) => {
    const ankaaFile = convertRemoteItemToAnkaaFile(item, `${folderName}/${subPath || ""}`);
    const canPreview = isPreviewableFile(item.name);

    const buttons: Array<{ text: string; onPress?: () => void; style?: "cancel" | "destructive" | "default" }> = [];

    if (canPreview) {
      buttons.push({
        text: "Visualizar",
        onPress: () => handleFilePress(item),
      });
    }

    buttons.push({
      text: "Compartilhar",
      onPress: () => fileViewer.shareFile(ankaaFile),
    });

    buttons.push({
      text: "Baixar",
      onPress: () => fileViewer.downloadFile(ankaaFile),
    });

    buttons.push({
      text: "Cancelar",
      style: "cancel",
    });

    Alert.alert(
      item.name,
      `${item.size}${item.lastModified ? ` - ${new Date(item.lastModified).toLocaleDateString("pt-BR")}` : ""}`,
      buttons
    );
  }, [folderName, subPath, fileViewer, handleFilePress]);

  // Breadcrumb segments
  const breadcrumbs = [folderName, ...(subPath ? subPath.split("/") : [])];

  const handleBreadcrumbPress = useCallback((index: number) => {
    if (index === 0) {
      onNavigate("");
    } else {
      const newPath = breadcrumbs.slice(1, index + 1).join("/");
      onNavigate(newPath);
    }
  }, [breadcrumbs, onNavigate]);

  // Filter directories and files based on search query
  const allDirectories = contents?.data?.files?.filter((f: any) => f.type === "directory") || [];
  const allFiles = contents?.data?.files?.filter((f: any) => f.type !== "directory") || [];

  const filteredDirectories = useMemo(() => {
    if (!searchQuery) return allDirectories;
    return allDirectories.filter((dir: any) => dir.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allDirectories, searchQuery]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return allFiles;
    return allFiles.filter((file: any) => file.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allFiles, searchQuery]);

  // Combined data for grid FlatList (directories first, then files)
  const combinedGridData = useMemo(() => {
    return [
      ...filteredDirectories.map((d: any) => ({ ...d, _itemType: "directory" as const })),
      ...filteredFiles.map((f: any) => ({ ...f, _itemType: "file" as const })),
    ];
  }, [filteredDirectories, filteredFiles]);

  // Toolbar rendered outside FlatList so SearchBar stays mounted and keeps focus
  const toolbar = (
    <View style={{ padding: 16, paddingBottom: 0 }}>
      {/* Breadcrumb navigation */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4, marginBottom: 12 }}>
        <TouchableOpacity onPress={onBack} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Icon name="home" size={16} color={colors.primary} />
          <Text style={{ fontSize: 13, color: colors.primary }}>Início</Text>
        </TouchableOpacity>
        {breadcrumbs.map((segment, index) => (
          <View key={index} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Icon name="chevron-right" size={14} color={colors.mutedForeground} />
            <TouchableOpacity
              onPress={() => handleBreadcrumbPress(index)}
              disabled={index === breadcrumbs.length - 1}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: index === breadcrumbs.length - 1 ? colors.foreground : colors.primary,
                  fontWeight: index === breadcrumbs.length - 1 ? "600" : "400",
                }}
                numberOfLines={1}
              >
                {segment}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Search bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar arquivos e pastas..."
        debounceMs={300}
        style={{ marginBottom: 10 }}
      />

      {/* Stats bar + view toggle */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <View style={{ flexDirection: "row", gap: 8, flexShrink: 1, flexWrap: "wrap" }}>
          {contents?.data && (
            <>
              <Badge variant="secondary">
                <Text style={{ fontSize: 11, color: colors.secondaryForeground }}>
                  {contents.data.totalFiles} arquivos
                </Text>
              </Badge>
              <Badge variant="secondary">
                <Text style={{ fontSize: 11, color: colors.secondaryForeground }}>
                  {contents.data.totalSize}
                </Text>
              </Badge>
            </>
          )}
        </View>
        <ViewModeToggle viewMode={viewMode} onChangeViewMode={onChangeViewMode} />
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        {toolbar}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.mutedForeground, fontSize: 14 }}>
            Carregando arquivos...
          </Text>
        </View>
      </View>
    );
  }

  // Empty folder or no search results
  const hasNoContent = !contents?.data?.files || contents.data.files.length === 0;
  const hasNoSearchResults = filteredDirectories.length === 0 && filteredFiles.length === 0 && searchQuery;

  if (hasNoContent) {
    return (
      <View style={{ flex: 1 }}>
        {toolbar}
        <EmptyState
          icon="folder-open"
          title="Pasta vazia"
          description="Nenhum arquivo encontrado nesta pasta"
        />
      </View>
    );
  }

  if (hasNoSearchResults) {
    return (
      <View style={{ flex: 1 }}>
        {toolbar}
        <EmptyState
          icon="search"
          title="Nenhum resultado"
          description="Nenhum arquivo ou pasta corresponde à sua busca"
        />
      </View>
    );
  }

  // ---- GRID VIEW ----
  if (viewMode === "grid") {
    return (
      <View style={{ flex: 1 }}>
        {toolbar}
        <FlatList
          key="browser-grid"
          data={combinedGridData}
          keyExtractor={(item: any) => `${item._itemType}-${item.name}`}
          numColumns={GRID_NUM_COLUMNS}
          contentContainerStyle={{ paddingHorizontal: GRID_PADDING, paddingBottom: GRID_PADDING }}
          columnWrapperStyle={{ gap: GRID_GAP, marginBottom: GRID_GAP }}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} />
          }
          renderItem={({ item }) => {
            if (item._itemType === "directory") {
              return (
                <DirectoryGridItem
                  dir={item}
                  onPress={() => handleDirectoryPress(item.name)}
                />
              );
            }
            const ankaaFile = convertRemoteItemToAnkaaFile(item, `${folderName}/${subPath || ""}`);
            return (
              <FileItem
                file={ankaaFile}
                viewMode="grid"
                onPress={() => handleFilePress(item)}
                onLongPress={() => handleFileLongPress(item)}
                containerStyle={{ width: GRID_ITEM_WIDTH }}
              />
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="file"
              title="Nenhum arquivo"
              description="Nao ha arquivos nesta pasta"
            />
          }
        />
      </View>
    );
  }

  // ---- LIST VIEW ----
  const renderListHeader = () => (
    <View>
      {/* Directories section */}
      {filteredDirectories.length > 0 && (
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.mutedForeground, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Pastas
          </Text>
          <View style={{ gap: 6 }}>
            {filteredDirectories.map((dir: any) => (
              <TouchableOpacity
                key={dir.name}
                onPress={() => handleDirectoryPress(dir.name)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.card,
                  borderRadius: 8,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  gap: 12,
                }}
              >
                <View style={{ backgroundColor: "#3b82f620", borderRadius: 8, padding: 8 }}>
                  <Icon name="folder" size={20} color="#3b82f6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "500", color: colors.foreground }} numberOfLines={1}>
                    {dir.name}
                  </Text>
                  {(dir.fileCount !== undefined || dir.folderCount !== undefined) && (
                    <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>
                      {dir.folderCount || 0} pastas · {dir.fileCount || 0} arquivos
                    </Text>
                  )}
                </View>
                <Icon name="chevron-right" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Files section header */}
      {filteredFiles.length > 0 && (
        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.mutedForeground, marginTop: 8, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Arquivos
        </Text>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {toolbar}
      <FlatList
        key="browser-list"
        data={filteredFiles}
        keyExtractor={(item: any) => item.name}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
        ListHeaderComponent={renderListHeader}
        renderItem={({ item }) => {
          const ankaaFile = convertRemoteItemToAnkaaFile(item, `${folderName}/${subPath || ""}`);
          return (
            <FileItem
              file={ankaaFile}
              viewMode="list"
              onPress={() => handleFilePress(item)}
              onLongPress={() => handleFileLongPress(item)}
              containerStyle={{ marginBottom: 6 }}
            />
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="file"
            title="Nenhum arquivo"
            description="Nao ha arquivos nesta pasta"
          />
        }
      />
    </View>
  );
}

// ============================================================
// Folder List Component (main view)
// ============================================================

function FolderList({
  onBrowseFolder,
  viewMode,
  onChangeViewMode,
}: {
  onBrowseFolder: (folderName: string) => void;
  viewMode: FileViewMode;
  onChangeViewMode: (mode: FileViewMode) => void;
}) {
  const { data, isLoading, refetch, isFetching } = useSharedFolders();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  useScreenReady(!isLoading);

  // Filter folders based on search query
  const filteredFolders = useMemo(() => {
    if (!data?.data) return [];
    if (!searchQuery) return data.data;
    return data.data.filter((folder: any) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data?.data, searchQuery]);

  if (isLoading) return null;

  if (!data?.data || data.data.length === 0) {
    return (
      <EmptyState
        icon="folder-share"
        title="Nenhuma pasta encontrada"
        description="Nao ha pastas configuradas no gerenciador de arquivos"
      />
    );
  }

  // Toolbar: search + stats + view toggle
  // Toolbar rendered outside FlatList so SearchBar stays mounted and keeps focus
  const toolbar = (
    <View style={{ padding: 16, paddingBottom: 0 }}>
      {/* Search bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar pastas..."
        debounceMs={300}
        style={{ marginBottom: 10 }}
      />

      {/* Stats + view toggle */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Badge variant="secondary">
          <Text style={{ fontSize: 11, color: colors.secondaryForeground }}>
            {filteredFolders.length} {filteredFolders.length === 1 ? "pasta" : "pastas"}
          </Text>
        </Badge>
        <ViewModeToggle viewMode={viewMode} onChangeViewMode={onChangeViewMode} />
      </View>
    </View>
  );

  // No search results
  if (filteredFolders.length === 0 && searchQuery) {
    return (
      <View style={{ flex: 1 }}>
        {toolbar}
        <EmptyState
          icon="search"
          title="Nenhum resultado"
          description="Nenhuma pasta corresponde à sua busca"
        />
      </View>
    );
  }

  // ---- GRID VIEW ----
  if (viewMode === "grid") {
    return (
      <View style={{ flex: 1 }}>
        {toolbar}
        <FlatList
          key="folder-grid"
          data={filteredFolders}
          keyExtractor={(item: any) => item.name}
          numColumns={GRID_NUM_COLUMNS}
          contentContainerStyle={{ paddingHorizontal: GRID_PADDING, paddingBottom: GRID_PADDING }}
          columnWrapperStyle={{ gap: GRID_GAP, marginBottom: GRID_GAP }}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} />
          }
          renderItem={({ item }) => (
            <FolderGridItem
              folder={item}
              onPress={() => onBrowseFolder(item.name)}
            />
          )}
        />
      </View>
    );
  }

  // ---- LIST VIEW ----
  return (
    <View style={{ flex: 1 }}>
      {toolbar}
      <FlatList
        key="folder-list"
        data={filteredFolders}
        keyExtractor={(item: any) => item.name}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <FolderListItem
            folder={item}
            onPress={() => onBrowseFolder(item.name)}
          />
        )}
      />
    </View>
  );
}

// ============================================================
// Main Screen
// ============================================================

export default function FileManagerScreen() {
  const [browseFolder, setBrowseFolder] = useState<string | null>(null);
  const [browseSubPath, setBrowseSubPath] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = usePersistedViewMode("list");

  const handleBrowseFolder = useCallback((folderName: string) => {
    setBrowseFolder(folderName);
    setBrowseSubPath(undefined);
  }, []);

  const handleNavigate = useCallback((newSubPath: string) => {
    if (!newSubPath) {
      setBrowseSubPath(undefined);
    } else {
      setBrowseSubPath(newSubPath);
    }
  }, []);

  const handleBackToFolders = useCallback(() => {
    setBrowseFolder(null);
    setBrowseSubPath(undefined);
  }, []);

  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.COMMERCIAL]}>
      <FileViewerProvider>
        <ThemedView className="flex-1">
          {browseFolder ? (
            <FileBrowser
              folderName={browseFolder}
              subPath={browseSubPath}
              onNavigate={handleNavigate}
              onBack={handleBackToFolders}
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
            />
          ) : (
            <FolderList
              onBrowseFolder={handleBrowseFolder}
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
            />
          )}
        </ThemedView>
      </FileViewerProvider>
    </PrivilegeGuard>
  );
}
