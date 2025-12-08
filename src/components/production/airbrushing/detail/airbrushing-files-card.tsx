
import { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconFiles, IconList, IconLayoutGrid, IconDownload } from "@tabler/icons-react-native";
import { FileItem, useFileViewer, type FileViewMode } from "@/components/file";
// import { showToast } from "@/components/ui/toast";

interface AirbrushingFilesCardProps {
  airbrushing: any;
}

export function AirbrushingFilesCard({ airbrushing }: AirbrushingFilesCardProps) {
  const { colors } = useTheme();
  const fileViewer = useFileViewer();
  const [viewMode, setViewMode] = useState<FileViewMode>("list");

  const receipts = airbrushing.receipts || [];
  const invoices = airbrushing.invoices || [];
  const artworks = airbrushing.artworks || [];

  const totalFiles = receipts.length + invoices.length + artworks.length;
  const allFiles = [...receipts, ...invoices, ...artworks];

  const hasFiles = totalFiles > 0;

  if (!hasFiles) {
    return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconFiles size={20} color={colors.primary} />
            <ThemedText style={styles.title}>Arquivos</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.emptyState}>
            <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted + "30" }])}>
              <IconFiles size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.emptyTitle, { color: colors.foreground }])}>
              Nenhum arquivo anexado
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.emptyDescription, { color: colors.mutedForeground }])}>
              Este airbrushing não possui recibos, notas fiscais ou artes anexados.
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconFiles size={20} color={colors.primary} />
          <ThemedText style={styles.title}>Arquivos</ThemedText>
          <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
            {totalFiles}
          </Badge>
        </View>
      </View>

      {/* View Mode Controls */}
      <View style={styles.viewModeControls}>
        {allFiles.length > 1 && (
          <TouchableOpacity
            style={[styles.downloadAllButton, { backgroundColor: colors.primary }]}
            onPress={async () => {
              for (const file of allFiles) {
                try {
                  await fileViewer.actions.downloadFile(file);
                } catch (error) {
                  console.error("Error downloading file:", error);
                }
              }
              Alert.alert("Sucesso", `${allFiles.length} arquivos baixados`);
            }}
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
            <IconList size={16} color={viewMode === "list" ? colors.primaryForeground : colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              { backgroundColor: viewMode === "grid" ? colors.primary : colors.muted }
            ]}
            onPress={() => setViewMode("grid")}
            activeOpacity={0.7}
          >
            <IconLayoutGrid size={16} color={viewMode === "grid" ? colors.primaryForeground : colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Receipts Section */}
        {receipts.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
              <ThemedText style={[styles.subsectionHeader, { color: colors.foreground }]}>
                Recibos
              </ThemedText>
              <Badge variant="secondary" size="sm">
                {receipts.length}
              </Badge>
            </View>
            <View style={viewMode === "grid" ? styles.gridContainer : styles.listContainer}>
              {receipts.map((file: any, index: number) => (
                <FileItem
                  key={file.id}
                  file={file}
                  viewMode={viewMode}
                  baseUrl={process.env.EXPO_PUBLIC_API_URL}
                  onPress={() => {
                    fileViewer.actions.viewFiles(receipts, index);
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Invoices Section */}
        {invoices.length > 0 && (
          <View style={[styles.section, receipts.length > 0 && { marginTop: spacing.xl }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
              <ThemedText style={[styles.subsectionHeader, { color: colors.foreground }]}>
                Notas Fiscais
              </ThemedText>
              <Badge variant="secondary" size="sm">
                {invoices.length}
              </Badge>
            </View>
            <View style={viewMode === "grid" ? styles.gridContainer : styles.listContainer}>
              {invoices.map((file: any, index: number) => (
                <FileItem
                  key={file.id}
                  file={file}
                  viewMode={viewMode}
                  baseUrl={process.env.EXPO_PUBLIC_API_URL}
                  onPress={() => {
                    fileViewer.actions.viewFiles(invoices, index);
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Artworks Section */}
        {artworks.length > 0 && (
          <View style={[styles.section, (receipts.length > 0 || invoices.length > 0) && { marginTop: spacing.xl }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
              <ThemedText style={[styles.subsectionHeader, { color: colors.foreground }]}>
                Artes
              </ThemedText>
              <Badge variant="secondary" size="sm">
                {artworks.length}
              </Badge>
            </View>
            <View style={viewMode === "grid" ? styles.gridContainer : styles.listContainer}>
              {artworks.map((file: any, index: number) => (
                <FileItem
                  key={file.id}
                  file={file}
                  viewMode={viewMode}
                  baseUrl={process.env.EXPO_PUBLIC_API_URL}
                  onPress={() => {
                    fileViewer.actions.viewFiles(artworks, index);
                  }}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  viewModeControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  downloadAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: "flex-start",
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
  content: {
    gap: spacing.sm,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  subsectionHeader: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  listContainer: {
    gap: spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});
