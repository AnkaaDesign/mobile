
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconFileText, IconNotes } from "@tabler/icons-react-native";
import type { Warning } from '../../../../types';
import { extendedColors } from "@/lib/theme/extended-colors";

interface WarningDescriptionCardProps {
  warning: Warning;
}

export function WarningDescriptionCard({ warning }: WarningDescriptionCardProps) {
  const { colors, isDark } = useTheme();

  // Don't render card if there's no description or HR notes
  if (!warning.description && !warning.hrNotes) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconFileText size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Descrição e Observações</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Description Section */}
        {warning.description && (
          <View style={styles.section}>
            <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
              Descrição Detalhada
            </ThemedText>
            <View style={StyleSheet.flatten([styles.descriptionBox, { backgroundColor: colors.muted + "30" }])}>
              <ThemedText style={StyleSheet.flatten([styles.text, { color: colors.foreground }])}>
                {warning.description}
              </ThemedText>
            </View>
          </View>
        )}

        {/* HR Notes Section */}
        {warning.hrNotes && (
          <View style={StyleSheet.flatten([styles.section, warning.description && styles.hrNotesSection, warning.description && { borderTopColor: colors.border + "50" }])}>
            <View style={styles.hrNotesHeader}>
              <IconNotes size={16} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
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
        )}
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
  section: {
    gap: spacing.lg,
  },
  subsectionHeader: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  hrNotesSection: {
    paddingTop: spacing.xl,
    borderTopWidth: 1,
  },
  hrNotesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  descriptionBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
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
