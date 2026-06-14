import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import { IconFile } from "@tabler/icons-react-native";
import type { WorkAccidentReport } from "@/types";
import { FileItem, useFileViewer } from "@/components/file";

interface WorkAccidentCatDocumentCardProps {
  report: WorkAccidentReport;
}

export function WorkAccidentCatDocumentCard({ report }: WorkAccidentCatDocumentCardProps) {
  const { colors } = useTheme();
  const fileViewer = useFileViewer();

  const file = report.file as any;

  if (!file) {
    return (
      <DetailCard title="Documento da CAT" icon="file-text">
        <View style={styles.emptyState}>
          <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted + "30" }])}>
            <IconFile size={32} color={colors.mutedForeground} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.emptyTitle, { color: colors.foreground }])}>
            Nenhum documento
          </ThemedText>
          <ThemedText style={StyleSheet.flatten([styles.emptyDescription, { color: colors.mutedForeground }])}>
            Esta CAT não possui documento anexado.
          </ThemedText>
        </View>
      </DetailCard>
    );
  }

  return (
    <DetailCard title="Documento da CAT" icon="file-text">
      <View style={styles.content}>
        <FileItem
          file={file}
          viewMode="list"
          baseUrl={process.env.EXPO_PUBLIC_API_URL}
          onPress={() => {
            fileViewer.actions.viewFiles([file], 0);
          }}
        />
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
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
