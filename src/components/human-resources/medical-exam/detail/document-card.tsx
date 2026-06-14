import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import { IconFile } from "@tabler/icons-react-native";
import type { MedicalExam } from "@/types";
import { FileItem, useFileViewer } from "@/components/file";

interface DocumentCardProps {
  exam: MedicalExam;
}

export function DocumentCard({ exam }: DocumentCardProps) {
  const { colors } = useTheme();
  const fileViewer = useFileViewer();
  const file = exam.file as any;

  if (!file) {
    return (
      <DetailCard title="Documento ASO" icon="paperclip">
        <View style={styles.emptyState}>
          <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted + "30" }])}>
            <IconFile size={32} color={colors.mutedForeground} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.emptyTitle, { color: colors.foreground }])}>
            Nenhum documento
          </ThemedText>
          <ThemedText style={StyleSheet.flatten([styles.emptyDescription, { color: colors.mutedForeground }])}>
            O ASO ainda não foi anexado a este exame.
          </ThemedText>
        </View>
      </DetailCard>
    );
  }

  return (
    <DetailCard title="Documento ASO" icon="paperclip">
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
