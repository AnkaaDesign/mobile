
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconFiles, IconFileText, IconReceipt, IconPalette } from "@tabler/icons-react-native";

interface AirbrushingFilesCardProps {
  airbrushing: any;
}

export function AirbrushingFilesCard({ airbrushing }: AirbrushingFilesCardProps) {
  const { colors } = useTheme();

  const hasFiles =
    (airbrushing.receipts?.length ?? 0) > 0 ||
    (airbrushing.invoices?.length ?? 0) > 0 ||
    (airbrushing.artworks?.length ?? 0) > 0;

  if (!hasFiles) {
    return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconFiles size={20} color={colors.mutedForeground} />
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
              Este airbrushing não possui recibos, notas fiscais ou arte anexados.
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
          <IconFiles size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Arquivos</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.infoContainer}>
          {/* Receipts Section */}
          {(airbrushing.receipts?.length ?? 0) > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconReceipt size={18} color={colors.mutedForeground} />
                <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
                  Recibos ({airbrushing.receipts?.length ?? 0})
                </ThemedText>
              </View>
              <View style={styles.filesContainer}>
                {airbrushing.receipts?.map((file: any) => (
                  <View
                    key={file.id}
                    style={StyleSheet.flatten([styles.fileItem, { backgroundColor: colors.muted + "50" }])}
                  >
                    <IconFileText size={16} color={colors.mutedForeground} />
                    <ThemedText
                      style={StyleSheet.flatten([styles.fileName, { color: colors.foreground }])}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {file.filename}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Invoices Section */}
          {(airbrushing.invoices?.length ?? 0) > 0 && (
            <View style={StyleSheet.flatten([
              styles.section,
              (airbrushing.receipts?.length ?? 0) > 0 && styles.separatedSection,
              { borderTopColor: colors.border + "50" }
            ])}>
              <View style={styles.sectionHeader}>
                <IconFileText size={18} color={colors.mutedForeground} />
                <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
                  Notas Fiscais ({airbrushing.invoices?.length ?? 0})
                </ThemedText>
              </View>
              <View style={styles.filesContainer}>
                {airbrushing.invoices?.map((file: any) => (
                  <View
                    key={file.id}
                    style={StyleSheet.flatten([styles.fileItem, { backgroundColor: colors.muted + "50" }])}
                  >
                    <IconFileText size={16} color={colors.mutedForeground} />
                    <ThemedText
                      style={StyleSheet.flatten([styles.fileName, { color: colors.foreground }])}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {file.filename}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Artworks Section */}
          {(airbrushing.artworks?.length ?? 0) > 0 && (
            <View style={StyleSheet.flatten([
              styles.section,
              ((airbrushing.receipts?.length ?? 0) > 0 || (airbrushing.invoices?.length ?? 0) > 0) && styles.separatedSection,
              { borderTopColor: colors.border + "50" }
            ])}>
              <View style={styles.sectionHeader}>
                <IconPalette size={18} color={colors.mutedForeground} />
                <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
                  Arte ({airbrushing.artworks?.length ?? 0})
                </ThemedText>
              </View>
              <View style={styles.filesContainer}>
                {airbrushing.artworks?.map((file: any) => (
                  <View
                    key={file.id}
                    style={StyleSheet.flatten([styles.fileItem, { backgroundColor: colors.muted + "50" }])}
                  >
                    <IconPalette size={16} color={colors.mutedForeground} />
                    <ThemedText
                      style={StyleSheet.flatten([styles.fileName, { color: colors.foreground }])}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {file.filename}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
  infoContainer: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.lg,
  },
  separatedSection: {
    paddingTop: spacing.xl,
    borderTopWidth: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  subsectionHeader: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  filesContainer: {
    gap: spacing.sm,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  fileName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
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
