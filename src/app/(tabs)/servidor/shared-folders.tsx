import { useState, useCallback } from "react";
import { View, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useSharedFolders, useSharedFolderContents } from "@/hooks/useServer";
import { Icon } from "@/components/ui/icon";
import { formatFileSize } from "@/utils/file";
import { Separator } from "@/components/ui/separator";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useTheme } from "@/lib/theme";
import { FileViewerProvider, useFileViewer } from "@/components/file/file-viewer";
import type { File as AnkaaFile } from "@/types";


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

// Convert a remote storage item to AnkaaFile format for the file viewer
function convertRemoteItemToAnkaaFile(
  item: { name: string; type: "file" | "directory"; size: string; lastModified: Date; remoteUrl?: string; webdavUrl?: string },
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
  }

  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(extension);
  const remoteUrl = item.remoteUrl || item.webdavUrl || "";

  return {
    id: `remote-${folderPath}-${item.name}`,
    filename: item.name,
    originalName: item.name,
    mimetype,
    path: remoteUrl,
    size: parseRemoteSize(item.size),
    thumbnailUrl: isImage && remoteUrl ? remoteUrl : null,
    createdAt: item.lastModified,
    updatedAt: item.lastModified,
  } as AnkaaFile;
}

// Get file icon name based on extension
function getFileIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
  if (["mp4", "webm", "ogg", "mov", "avi", "mkv"].includes(ext)) return "video";
  if (ext === "pdf") return "file-text";
  if (["doc", "docx", "txt", "rtf"].includes(ext)) return "file-text";
  if (["xls", "xlsx", "csv"].includes(ext)) return "table";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
  if (["eps", "ai", "psd"].includes(ext)) return "palette";
  return "file";
}

// Get file icon color based on extension
function getFileIconColor(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return "#ec4899";
  if (["mp4", "webm", "ogg", "mov", "avi", "mkv"].includes(ext)) return "#8b5cf6";
  if (ext === "pdf") return "#ef4444";
  if (["doc", "docx", "txt", "rtf"].includes(ext)) return "#3b82f6";
  if (["xls", "xlsx", "csv"].includes(ext)) return "#22c55e";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "#f59e0b";
  if (["eps", "ai", "psd"].includes(ext)) return "#a855f7";
  return "#6b7280";
}

// ============================================================
// File Browser Component (browse mode)
// ============================================================

function FileBrowser({
  folderName,
  subPath,
  onNavigate,
  onBack,
}: {
  folderName: string;
  subPath?: string;
  onNavigate: (newSubPath: string) => void;
  onBack: () => void;
}) {
  const { colors } = useTheme();
  const fileViewer = useFileViewer();
  const { data: contents, isLoading, isFetching, refetch } = useSharedFolderContents(folderName, subPath);

  const handleDirectoryPress = useCallback((dirName: string) => {
    const newPath = subPath ? `${subPath}/${dirName}` : dirName;
    onNavigate(newPath);
  }, [subPath, onNavigate]);

  const handleFilePress = useCallback((item: any) => {
    const ankaaFile = convertRemoteItemToAnkaaFile(item, `${folderName}/${subPath || ""}`);

    // For images, gather all image files for gallery navigation
    const extension = item.name.split(".").pop()?.toLowerCase() || "";
    const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(extension);

    if (isImage && contents?.data?.files) {
      const allImages = contents.data.files
        .filter((f: any) => {
          const ext = f.name.split(".").pop()?.toLowerCase() || "";
          return f.type !== "directory" && ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext);
        })
        .map((f: any) => convertRemoteItemToAnkaaFile(f, `${folderName}/${subPath || ""}`));

      const imageIndex = allImages.findIndex((f: AnkaaFile) => f.id === ankaaFile.id);
      if (imageIndex !== -1) {
        fileViewer.viewFiles(allImages, imageIndex);
        return;
      }
    }

    fileViewer.viewFile(ankaaFile);
  }, [folderName, subPath, contents, fileViewer]);

  // Breadcrumb segments
  const breadcrumbs = [folderName, ...(subPath ? subPath.split("/") : [])];

  const handleBreadcrumbPress = useCallback((index: number) => {
    if (index === 0) {
      // Go back to root of this folder
      onNavigate("");
    } else {
      const newPath = breadcrumbs.slice(1, index + 1).join("/");
      onNavigate(newPath);
    }
  }, [breadcrumbs, onNavigate]);

  const directories = contents?.data?.files?.filter((f: any) => f.type === "directory") || [];
  const files = contents?.data?.files?.filter((f: any) => f.type !== "directory") || [];

  const renderHeader = () => (
    <View style={{ marginBottom: 12 }}>
      {/* Breadcrumb navigation */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4, marginBottom: 12 }}>
        <TouchableOpacity onPress={onBack}>
          <Icon name="home" size={16} color={colors.primary} />
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

      {/* Stats bar */}
      {contents?.data && (
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}>
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
        </View>
      )}

      {/* Directories section */}
      {directories.length > 0 && (
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.mutedForeground, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Pastas
          </Text>
          <View style={{ gap: 6 }}>
            {directories.map((dir: any) => (
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
                </View>
                <Icon name="chevron-right" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Files section header */}
      {files.length > 0 && (
        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.mutedForeground, marginTop: 8, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Arquivos
        </Text>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.mutedForeground, fontSize: 14 }}>
          Carregando arquivos...
        </Text>
      </View>
    );
  }

  if (!contents?.data?.files || contents.data.files.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        {/* Breadcrumb even for empty folders */}
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
            <TouchableOpacity onPress={onBack}>
              <Icon name="home" size={16} color={colors.primary} />
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
        </View>
        <EmptyState
          icon="folder-open"
          title="Pasta vazia"
          description="Nenhum arquivo encontrado nesta pasta"
        />
      </View>
    );
  }

  return (
    <FlatList
      data={files}
      keyExtractor={(item: any) => item.name}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl refreshing={isFetching} onRefresh={refetch} />
      }
      ListHeaderComponent={renderHeader}
      renderItem={({ item }) => {
        const iconName = getFileIcon(item.name);
        const iconColor = getFileIconColor(item.name);

        return (
          <TouchableOpacity
            onPress={() => handleFilePress(item)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.card,
              borderRadius: 8,
              padding: 12,
              marginBottom: 6,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 12,
            }}
          >
            <View style={{ backgroundColor: iconColor + "20", borderRadius: 8, padding: 8 }}>
              <Icon name={iconName} size={20} color={iconColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: colors.foreground }} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                {item.size} {item.lastModified ? `· ${new Date(item.lastModified).toLocaleDateString("pt-BR")}` : ""}
              </Text>
            </View>
            <Icon name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <EmptyState
          icon="file"
          title="Nenhum arquivo"
          description="Não há arquivos nesta pasta"
        />
      }
    />
  );
}

// ============================================================
// Folder List Component (main view)
// ============================================================

function FolderList({
  onBrowseFolder,
}: {
  onBrowseFolder: (folderName: string) => void;
}) {
  const { data, isLoading, refetch, isFetching } = useSharedFolders();
  const { colors } = useTheme();

  useScreenReady(!isLoading);

  const getPermissionLevel = (permissions: string): "full" | "read-write" | "read-only" | "restricted" => {
    if (permissions.includes("drwxrwsr-x") || permissions.includes("drwxrwxr-x")) {
      return "full";
    } else if (permissions.includes("rw") || permissions.includes("w")) {
      return "read-write";
    } else if (permissions.includes("r")) {
      return "read-only";
    }
    return "restricted";
  };

  const getPermissionBadgeVariant = (level: string) => {
    switch (level) {
      case "full":
        return "default";
      case "read-write":
        return "secondary";
      case "read-only":
        return "info";
      case "restricted":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getFolderIcon = (type?: string): string => {
    switch (type) {
      case "artwork":
        return "palette";
      case "general":
        return "file-text";
      case "backup":
        return "archive";
      case "receipts":
      case "invoices":
        return "file-invoice";
      case "images":
      case "thumbnails":
        return "image";
      case "trash":
        return "trash";
      default:
        return "folder";
    }
  };

  if (isLoading) return null;

  if (!data?.data || data.data.length === 0) {
    return (
      <EmptyState
        icon="folder-share"
        title="Nenhuma pasta encontrada"
        description="Não há pastas compartilhadas configuradas"
      />
    );
  }

  return (
    <FlatList
      data={data.data}
      keyExtractor={(item) => item.name}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl refreshing={isFetching} onRefresh={refetch} />
      }
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => onBrowseFolder(item.name)} activeOpacity={0.7}>
          <Card className="mb-4">
            <CardHeader>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <Icon
                    name={getFolderIcon(item.type)}
                    className="w-6 h-6 text-primary"
                  />
                  <View className="flex-1">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    {item.type && (
                      <Badge variant="outline" className="mt-1 self-start">
                        <Text style={{ fontSize: 11, color: colors.foreground }}>{item.type}</Text>
                      </Badge>
                    )}
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color={colors.mutedForeground} />
              </View>
            </CardHeader>

            <CardContent className="gap-3">
              {/* Description */}
              {item.description && (
                <Text className="text-sm text-muted-foreground italic">
                  {item.description}
                </Text>
              )}

              {/* Statistics */}
              <View className="flex-row flex-wrap gap-2">
                <Badge variant="secondary">
                  <Text style={{ fontSize: 11, color: colors.secondaryForeground }}>
                    {item.fileCount ?? 0} arquivos
                  </Text>
                </Badge>
                <Badge variant="secondary">
                  <Text style={{ fontSize: 11, color: colors.secondaryForeground }}>
                    {item.subdirCount ?? 0} pastas
                  </Text>
                </Badge>
                <Badge variant="secondary">
                  <Text style={{ fontSize: 11, color: colors.secondaryForeground }}>
                    {formatFileSize(typeof item.size === 'number' ? item.size : parseInt(item.size || '0', 10))}
                  </Text>
                </Badge>
              </View>

              <Separator />

              {/* Path Info */}
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Icon name="map-pin" className="w-4 h-4 text-muted-foreground" />
                  <Text className="text-sm text-muted-foreground flex-1">
                    {item.path}
                  </Text>
                </View>

                {item.remotePath && (
                  <View className="flex-row items-center gap-2">
                    <Icon name="globe" className="w-4 h-4 text-muted-foreground" />
                    <Text className="text-sm text-muted-foreground flex-1" numberOfLines={1}>
                      {item.remotePath}
                    </Text>
                  </View>
                )}
              </View>

              <Separator />

              {/* Permissions and Ownership */}
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted-foreground">Permissões</Text>
                  <Badge variant={getPermissionBadgeVariant(getPermissionLevel(item.permissions))}>
                    <Text style={{ fontSize: 11, color: "#fff" }}>
                      {getPermissionLevel(item.permissions).toUpperCase()}
                    </Text>
                  </Badge>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted-foreground">Proprietário</Text>
                  <Badge variant="outline">
                    <Text style={{ fontSize: 11, color: colors.foreground }}>{item.owner}</Text>
                  </Badge>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted-foreground">Grupo</Text>
                  <Badge variant="outline">
                    <Text style={{ fontSize: 11, color: colors.foreground }}>{item.group}</Text>
                  </Badge>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted-foreground">Modificado</Text>
                  <Text className="text-sm">
                    {new Date(item.lastModified).toLocaleDateString("pt-BR")}
                  </Text>
                </View>
              </View>

              {/* Browse button */}
              <Button
                variant="outline"
                size="sm"
                onPress={() => onBrowseFolder(item.name)}
                style={{ marginTop: 4 }}
              >
                <Icon name="folder-open" size={16} color={colors.primary} />
                <ThemedText className="text-sm font-medium" style={{ color: colors.primary }}>
                  Navegar
                </ThemedText>
              </Button>
            </CardContent>
          </Card>
        </TouchableOpacity>
      )}
    />
  );
}

// ============================================================
// Main Screen
// ============================================================

export default function SharedFoldersScreen() {
  const [browseFolder, setBrowseFolder] = useState<string | null>(null);
  const [browseSubPath, setBrowseSubPath] = useState<string | undefined>(undefined);

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

  const handleBackOneLevel = useCallback(() => {
    if (browseSubPath) {
      const parts = browseSubPath.split("/");
      parts.pop();
      const newPath = parts.join("/");
      setBrowseSubPath(newPath || undefined);
    } else {
      handleBackToFolders();
    }
  }, [browseSubPath, handleBackToFolders]);

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.ADMIN}>
      <FileViewerProvider>
        <ThemedView className="flex-1">
          {/* Header */}
          <ThemedView className="p-4 border-b border-border">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {browseFolder && (
                <TouchableOpacity onPress={handleBackOneLevel} style={{ padding: 4 }}>
                  <Icon name="arrow-left" size={20} />
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }}>
                <Text className="text-2xl font-bold">
                  {browseFolder ? browseFolder : "Gerenciador de Arquivos"}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {browseFolder
                    ? browseSubPath || "Raiz da pasta"
                    : "Gerenciar pastas compartilhadas do servidor"
                  }
                </Text>
              </View>
            </View>
          </ThemedView>

          {/* Content */}
          {browseFolder ? (
            <FileBrowser
              folderName={browseFolder}
              subPath={browseSubPath}
              onNavigate={handleNavigate}
              onBack={handleBackToFolders}
            />
          ) : (
            <FolderList onBrowseFolder={handleBrowseFolder} />
          )}
        </ThemedView>
      </FileViewerProvider>
    </PrivilegeGuard>
  );
}
