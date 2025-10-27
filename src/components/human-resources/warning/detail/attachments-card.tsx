import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import type { Warning } from '../../../../types';
import { Card } from "@/components/ui/card";
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
      <Card style={styles.card}>
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconPaperclip size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Anexos</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.emptyContainer}>
            <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted }])}>
              <IconFile size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
              Nenhum anexo encontrado
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconPaperclip size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Anexos</ThemedText>
          </View>
          <Badge variant="secondary">
            <ThemedText style={styles.badgeText}>
              {warning.attachments.length} arquivo{warning.attachments.length !== 1 ? "s" : ""}
            </ThemedText>
          </Badge>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.filesGrid}>
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
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
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
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  content: {
    gap: spacing.md,
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
  filesGrid: {
    gap: spacing.sm,
  },
});
