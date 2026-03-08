
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard, DetailSection } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconNotes } from "@tabler/icons-react-native";
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
    <DetailCard title="Descrição e Observações" icon="file-text">
      <View style={styles.content}>
        {/* Description Section */}
        {warning.description && (
          <DetailSection title="Descrição Detalhada">
            <View style={StyleSheet.flatten([styles.descriptionBox, { backgroundColor: colors.muted + "30" }])}>
              <ThemedText style={StyleSheet.flatten([styles.text, { color: colors.foreground }])}>
                {warning.description}
              </ThemedText>
            </View>
          </DetailSection>
        )}

        {/* HR Notes Section */}
        {warning.hrNotes && (
          <DetailSection title="Notas do RH">
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
          </DetailSection>
        )}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
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
