import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import type { Item } from "@/types";

interface CertificateCardProps {
  item?: Item;
}

export function CertificateCard({ item }: CertificateCardProps) {
  const { colors } = useTheme();

  const hasCA = item?.ppeCA;

  if (!hasCA) {
    return null; // Don't render if no certificate info
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Icon name="certificate" size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Certificado de Aprovação (CA)</ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        {/* CA Number */}
        {hasCA && (
          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.fieldLabelWithIcon}>
              <Icon name="file-certificate" size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Número do CA</ThemedText>
            </View>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>{item.ppeCA}</ThemedText>
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
    gap: spacing.xs,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  fieldLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
  },
  fieldValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
