import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import type { Warning } from '../../../../types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconPaperclip, IconFile, IconDownload } from "@tabler/icons-react-native";
import { FileItem, useFileViewer, type FileViewMode } from "@/components/file";
import { showToast } from "@/components/ui/toast";

interface AttachmentsCardProps {
  warning: Warning;
}

export function AttachmentsCard({ warning }: AttachmentsCardProps) {
  const { colors } = useTheme();
  const fileViewer = useFileViewer();
  const [viewMode, setViewMode] = React.useState<FileViewMode>("list");

  if (!warning.attachments || warning.attachments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle style={styles.sectionTitle}>
            <View style={styles.titleRow}>
              <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
                <IconPaperclip size={18} color={colors.primary} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Anexos</ThemedText>
            </View>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.emptyContainer}>
            <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted }])}>
              <IconFile size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
              Nenhum anexo encontrado
            </ThemedText>
          </View>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconPaperclip size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Anexos</ThemedText>
            <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
              {warning.attachments.length}
            </Badge>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {warning.attachments.length > 1 && (
          <TouchableOpacity
            style={[styles.downloadAllButton, { backgroundColor: colors.primary }]}
            onPress={async () => {
              for (const file of warning.attachments || []) {
                try {
                  await fileViewer.actions.downloadFile(file);
                } catch (error) {
                  console.error("Error downloading file:", error);
                }
              }
              showToast({ message: `${warning.attachments?.length} arquivos baixados`, type: "success" });
            }}
            activeOpacity={0.7}
          >
            <IconDownload size={16} color={colors.primaryForeground} />
            <ThemedText style={[styles.downloadAllText, { color: colors.primaryForeground }]}>
              Baixar Todos
            </ThemedText>
          </TouchableOpacity>
        )}

        <View style={styles.listContainer}>
          {warning.attachments.map((file: any, index: number) => (
            <FileItem
              key={file.id}
              file={file}
              viewMode="list"
              baseUrl={process.env.EXPO_PUBLIC_API_URL}
              onPress={() => {
                fileViewer.actions.viewFiles(warning.attachments || [], index);
              }}
            />
          ))}
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  downloadAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: "flex-start",
    marginBottom: spacing.md,
  },
  downloadAllText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  listContainer: {
    gap: spacing.sm,
  },
});
