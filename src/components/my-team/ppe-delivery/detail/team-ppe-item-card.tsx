import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconPackage, IconTag, IconCertificate, IconRuler, IconBarcode } from "@tabler/icons-react-native";
import type { PpeDelivery } from '@/types';

interface TeamPpeItemCardProps {
  delivery: PpeDelivery;
}

export function TeamPpeItemCard({ delivery }: TeamPpeItemCardProps) {
  const { colors } = useTheme();

  if (!delivery.item) {
    return null;
  }

  const item = delivery.item;

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconPackage size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Item EPI</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Item Name */}
        <View style={styles.itemHeader}>
          <ThemedText style={[styles.itemName, { color: colors.foreground }]}>
            {item.name}
          </ThemedText>
          {item.uniCode && (
            <Badge variant="secondary" size="sm">
              <ThemedText style={{ fontSize: fontSize.xs }}>{item.uniCode}</ThemedText>
            </Badge>
          )}
        </View>

        {/* Brand */}
        {item.brand && (
          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.fieldLabelWithIcon}>
              <IconTag size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Marca
              </ThemedText>
            </View>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
              {item.brand.name}
            </ThemedText>
          </View>
        )}

        {/* Category */}
        {item.category && (
          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.fieldLabelWithIcon}>
              <IconTag size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Categoria
              </ThemedText>
            </View>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
              {item.category.name}
            </ThemedText>
          </View>
        )}

        {/* PPE CA (Certificate) */}
        {item.ppeCA && (
          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.fieldLabelWithIcon}>
              <IconCertificate size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                CA
              </ThemedText>
            </View>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
              {item.ppeCA}
            </ThemedText>
          </View>
        )}

        {/* Quantity */}
        <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
          <View style={styles.fieldLabelWithIcon}>
            <IconBarcode size={16} color={colors.mutedForeground} />
            <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              Quantidade
            </ThemedText>
          </View>
          <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
            {delivery.quantity || 1}
          </ThemedText>
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
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  itemName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    flex: 1,
    marginRight: spacing.sm,
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
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  fieldValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: "right",
  },
  descriptionContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  descriptionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  descriptionText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
