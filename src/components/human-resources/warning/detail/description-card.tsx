
import { View, StyleSheet } from "react-native";
import type { Warning } from '../../../../types';
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconFileText, IconNotes } from "@tabler/icons-react-native";
import { extendedColors } from "@/lib/theme/extended-colors";

interface DescriptionCardProps {
  warning: Warning;
}

export function DescriptionCard({ warning }: DescriptionCardProps) {
  const { colors, isDark } = useTheme();

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconFileText size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
            Detalhes da Advertência
          </ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        {/* Reason */}
        <View>
          <ThemedText style={StyleSheet.flatten([styles.sectionTitle, { color: colors.mutedForeground }])}>
            Motivo
          </ThemedText>
          <View style={StyleSheet.flatten([styles.reasonBox, { backgroundColor: colors.muted + "80" }])}>
            <ThemedText style={StyleSheet.flatten([styles.text, { color: colors.foreground }])}>
              {warning.reason}
            </ThemedText>
          </View>
        </View>

        {/* Description */}
        {warning.description && (
          <>
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <View>
              <ThemedText style={StyleSheet.flatten([styles.sectionTitle, { color: colors.mutedForeground }])}>
                Descrição Detalhada
              </ThemedText>
              <View style={StyleSheet.flatten([styles.descriptionBox, { backgroundColor: colors.muted + "30" }])}>
                <ThemedText style={StyleSheet.flatten([styles.text, { color: colors.foreground }])}>
                  {warning.description}
                </ThemedText>
              </View>
            </View>
          </>
        )}

        {/* HR Notes */}
        {warning.hrNotes && (
          <>
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <View>
              <View style={styles.hrNotesHeader}>
                <IconNotes size={14} color={colors.mutedForeground} />
                <ThemedText style={StyleSheet.flatten([styles.sectionTitle, { color: colors.mutedForeground }])}>
                  Notas do RH
                </ThemedText>
              </View>
              <View
                style={StyleSheet.flatten([
                  styles.hrNotesBox,
                  {
                    backgroundColor: isDark ? extendedColors.amber[950] + "33" : extendedColors.amber[50],
                    borderColor: isDark ? extendedColors.amber[900] : extendedColors.amber[200],
                  },
                ])}
              >
                <ThemedText style={StyleSheet.flatten([styles.text, { color: colors.foreground }])}>
                  {warning.hrNotes}
                </ThemedText>
              </View>
            </View>
          </>
        )}
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
    borderBottomWidth: 1,
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
  content: {
    gap: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  reasonBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  descriptionBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  hrNotesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  hrNotesBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  text: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.6,
  },
});
