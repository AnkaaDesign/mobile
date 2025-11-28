
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconBox, IconRuler, IconShield, IconTag } from "@tabler/icons-react-native";
import { PPE_TYPE_LABELS } from "@/constants";
import type { PpeDelivery } from '../../../../../types';

interface ItemDetailsCardProps {
  delivery: PpeDelivery;
}

export function ItemDetailsCard({ delivery }: ItemDetailsCardProps) {
  const { colors } = useTheme();
  const item = delivery.item;

  if (!item) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconBox size={20} color={colors.mutedForeground} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>Detalhes do EPI</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <IconTag size={16} color={colors.mutedForeground} style={styles.infoIcon} />
              <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Item</ThemedText>
            </View>
            <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])} numberOfLines={2}>
              {item.name}
            </ThemedText>
          </View>

          {item.ppeType && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <IconShield size={16} color={colors.mutedForeground} style={styles.infoIcon} />
                <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Tipo de EPI</ThemedText>
              </View>
              <Badge variant="secondary">
                <ThemedText style={styles.badgeText}>{PPE_TYPE_LABELS[item.ppeType]}</ThemedText>
              </Badge>
            </View>
          )}

          {item.ppeSize && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <IconRuler size={16} color={colors.mutedForeground} style={styles.infoIcon} />
                <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Tamanho</ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>{item.ppeSize}</ThemedText>
            </View>
          )}

          {item.ppeCA && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <IconShield size={16} color={colors.mutedForeground} style={styles.infoIcon} />
                <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>CA</ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>{item.ppeCA}</ThemedText>
            </View>
          )}

          {item.category?.name && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <IconTag size={16} color={colors.mutedForeground} style={styles.infoIcon} />
                <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Categoria</ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])} numberOfLines={1}>
                {item.category.name}
              </ThemedText>
            </View>
          )}

          {item.brand?.name && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <IconTag size={16} color={colors.mutedForeground} style={styles.infoIcon} />
                <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Marca</ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])} numberOfLines={1}>
                {item.brand.name}
              </ThemedText>
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
    gap: spacing.md,
  },
  infoContainer: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoIcon: {
    marginRight: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    maxWidth: "50%",
    textAlign: "right",
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
