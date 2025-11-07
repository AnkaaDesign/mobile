import { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconFiles, IconList, IconLayoutGrid, IconDownload } from "@tabler/icons-react-native";
import { FileItem, useFileViewer, type FileViewMode } from "@/components/file";
import { showToast } from "@/components/ui/toast";
import type { File } from "@/types";

interface ObservationFilesCardProps {
  files: File[];
}

export function ObservationFilesCard({ files }: ObservationFilesCardProps) {
  const { colors } = useTheme();
  const [viewMode, setViewMode] = useState<FileViewMode>("grid");
  const fileViewer = useFileViewer();

  if (!files || files.length === 0) {
    return null;
  }

  const handleDownloadAll = async () => {
    for (const file of files) {
      try {
        await fileViewer.actions.downloadFile(file);
      } catch (error) {
        console.error("Error downloading file:", error);
      }
    }
    showToast({
      message: `${files.length} arquivo${files.length > 1 ? 's' : ''} baixado${files.length > 1 ? 's' : ''}`,
      type: "success"
    });
  };

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <IconFiles size={20} color={colors.primary} />
        <ThemedText style={styles.sectionTitle}>Arquivos</ThemedText>
        <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
          {files.length}
        </Badge>
      </View>

      <View style={styles.content}>
        {/* View Mode Controls */}
        <View style={styles.viewModeControls}>
          {files.length > 1 && (
            <TouchableOpacity
              style={[styles.downloadAllButton, { backgroundColor: colors.primary }]}
              onPress={handleDownloadAll}
              activeOpacity={0.7}
            >
              <IconDownload size={16} color={colors.primaryForeground} />
              <ThemedText style={[styles.downloadAllText, { color: colors.primaryForeground }]}>
                Baixar Todos
              </ThemedText>
            </TouchableOpacity>
          )}
          <View style={styles.viewModeButtons}>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                { backgroundColor: viewMode === "list" ? colors.primary : colors.muted }
              ]}
              onPress={() => setViewMode("list")}
              activeOpacity={0.7}
            >
              <IconList
                size={16}
                color={viewMode === "list" ? colors.primaryForeground : colors.foreground}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                { backgroundColor: viewMode === "grid" ? colors.primary : colors.muted }
              ]}
              onPress={() => setViewMode("grid")}
              activeOpacity={0.7}
            >
              <IconLayoutGrid
                size={16}
                color={viewMode === "grid" ? colors.primaryForeground : colors.foreground}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Files Display */}
        <View style={viewMode === "grid" ? styles.gridContainer : styles.listContainer}>
          {files.map((file, index) => (
            <FileItem
              key={file.id}
              file={file}
              viewMode={viewMode}
              baseUrl={process.env.EXPO_PUBLIC_API_URL}
              onPress={() => {
                fileViewer.actions.viewFiles(files, index);
              }}
            />
          ))}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  viewModeControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  downloadAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  downloadAllText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  viewModeButtons: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  viewModeButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  listContainer: {
    gap: spacing.sm,
  },
});
