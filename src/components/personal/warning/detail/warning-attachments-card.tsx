
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconPaperclip, IconFile } from "@tabler/icons-react-native";
import type { Warning } from '../../../../types';
import { FileItem, useFileViewer } from "@/components/file";

interface WarningAttachmentsCardProps {
  warning: Warning;
}

export function WarningAttachmentsCard({ warning }: WarningAttachmentsCardProps) {
  const { colors } = useTheme();
  const fileViewer = useFileViewer();

  if (!warning.attachments || warning.attachments.length === 0) {
    return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconPaperclip size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Anexos</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.emptyState}>
            <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted + "30" }])}>
              <IconFile size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.emptyTitle, { color: colors.foreground }])}>
              Nenhum anexo
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.emptyDescription, { color: colors.mutedForeground }])}>
              Esta advertência não possui arquivos anexados.
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <IconPaperclip size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Anexos</ThemedText>
          </View>
          <Badge variant="secondary">
            <ThemedText style={styles.badgeText}>
              {warning.attachments.length}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
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
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  content: {
    gap: spacing.sm,
  },
  filesGrid: {
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
