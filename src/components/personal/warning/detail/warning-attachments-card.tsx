
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconFile } from "@tabler/icons-react-native";
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
      <DetailCard title="Anexos" icon="paperclip">
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
      </DetailCard>
    );
  }

  return (
    <DetailCard
      title="Anexos"
      icon="paperclip"
      badge={
        <Badge variant="secondary">
          <ThemedText style={styles.badgeText}>
            {warning.attachments.length}
          </ThemedText>
        </Badge>
      }
    >
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
    </DetailCard>
  );
}

const styles = StyleSheet.create({
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
