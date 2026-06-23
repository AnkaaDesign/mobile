import { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import {
  IconFileText,
  IconList,
  IconLayoutGrid,
  IconReceipt
} from "@tabler/icons-react-native";
import { FileItem, useFileViewer, type FileViewMode } from "@/components/file";
import type { Order, File } from "@/types";

interface OrderDocumentsCardProps {
  order: Order;
}

export function OrderDocumentsCard({ order }: OrderDocumentsCardProps) {
  const { colors } = useTheme();
  const [viewMode, setViewMode] = useState<FileViewMode>("grid");
  const fileViewer = useFileViewer();

  const receipts = order.receipts || [];

  const allDocuments = [...receipts];
  const hasDocuments = allDocuments.length > 0;

  const handleFilePress = (file: File) => {
    const index = allDocuments.findIndex((f) => f.id === file.id);
    fileViewer.actions.viewFiles(allDocuments, index);
  };

  const renderFileSection = (
    title: string,
    files: File[],
    icon: React.ReactNode,
    color: string
  ) => {
    if (files.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          {icon}
          <ThemedText style={[styles.sectionTitle, { color }]}>
            {title}
          </ThemedText>
          <ThemedText style={[styles.sectionCount, { color: colors.mutedForeground }]}>
            ({files.length})
          </ThemedText>
        </View>
        <View style={viewMode === "grid" ? styles.gridContainer : styles.listContainer}>
          {files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              viewMode={viewMode}
              baseUrl={process.env.EXPO_PUBLIC_API_URL}
              onPress={handleFilePress}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <DetailCard
      title="Comprovantes"
      icon="file-text"
      badge={
        hasDocuments ? (
          <View style={styles.viewModeButtons}>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                {
                  backgroundColor:
                    viewMode === "list" ? colors.primary : colors.muted,
                },
              ]}
              onPress={() => setViewMode("list")}
              activeOpacity={0.7}
            >
              <IconList
                size={16}
                color={
                  viewMode === "list"
                    ? colors.primaryForeground
                    : colors.foreground
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                {
                  backgroundColor:
                    viewMode === "grid" ? colors.primary : colors.muted,
                },
              ]}
              onPress={() => setViewMode("grid")}
              activeOpacity={0.7}
            >
              <IconLayoutGrid
                size={16}
                color={
                  viewMode === "grid"
                    ? colors.primaryForeground
                    : colors.foreground
                }
              />
            </TouchableOpacity>
          </View>
        ) : undefined
      }
    >
        {hasDocuments ? (
          <>
            {renderFileSection(
              "Comprovantes",
              receipts,
              <IconReceipt size={20} color="#a855f7" />,
              "#a855f7"
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIconContainer,
                { backgroundColor: colors.muted + "30" },
              ]}
            >
              <IconFileText size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={[styles.emptyTitle, { color: colors.foreground }]}>
              Nenhum comprovante cadastrado
            </ThemedText>
            <ThemedText
              style={[
                styles.emptyDescription,
                { color: colors.mutedForeground },
              ]}
            >
              Este pedido não possui comprovantes anexados.
            </ThemedText>
          </View>
        )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  sectionCount: {
    fontSize: fontSize.sm,
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
    paddingVertical: spacing.xl,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
