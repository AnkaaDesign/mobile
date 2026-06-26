import { View, StyleSheet } from "react-native";
import type { Warning } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconFile } from "@tabler/icons-react-native";
import { FileItem, useFileViewer } from "@/components/file";
import { DetailCard } from "@/components/ui/detail-page-layout";

interface AttachmentsCardProps {
  warning: Warning;
}

export function AttachmentsCard({ warning }: AttachmentsCardProps) {
  const { colors } = useTheme();
  const fileViewer = useFileViewer();

  if (!warning.attachments || warning.attachments.length === 0) {
    return (
      <DetailCard title="Anexos" icon="paperclip">
        <View style={styles.emptyContainer}>
          <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted }])}>
            <IconFile size={32} color={colors.mutedForeground} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
            Nenhum anexo encontrado
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
            {warning.attachments.length} arquivo{warning.attachments.length !== 1 ? "s" : ""}
          </ThemedText>
        </Badge>
      }
    >
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
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
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
