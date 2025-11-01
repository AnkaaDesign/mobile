
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { IconShield, IconPackage, IconHash } from "@tabler/icons-react-native";
import { PPE_TYPE_LABELS } from '../../../../../constants';
import type { PpeDeliverySchedule } from '../../../../../types';

interface PpeItemsCardProps {
  schedule: PpeDeliverySchedule;
}

export function PpeItemsCard({ schedule }: PpeItemsCardProps) {
  const { colors, isDark } = useTheme();

  if (!schedule.ppeItems || schedule.ppeItems.length === 0) {
    return (
      <Card style={styles.card}>
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.titleRow}>
            <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
              <IconShield size={18} color={colors.primary} />
            </View>
            <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
              Itens de EPI
            </ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View
            style={StyleSheet.flatten([
              styles.emptyState,
              { backgroundColor: colors.muted + "30" },
            ])}
          >
            <IconShield size={40} color={colors.mutedForeground} />
            <ThemedText
              style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}
            >
              Nenhum item de EPI configurado
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  }

  const totalItems = schedule.ppeItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
            <IconShield size={18} color={colors.primary} />
          </View>
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
            Itens de EPI
          </ThemedText>
        </View>
        <Badge variant="secondary">
          <IconPackage size={14} color={colors.secondaryForeground} />
          <ThemedText
            style={{
              color: colors.secondaryForeground,
              fontSize: fontSize.xs,
              marginLeft: spacing.xs,
            }}
          >
            {schedule.ppeItems.length} tipo(s)
          </ThemedText>
        </Badge>
      </View>
      <View style={styles.content}>
        <View style={styles.content}>
          {/* Total Items Summary */}
          <View
            style={StyleSheet.flatten([
              styles.totalBox,
              {
                backgroundColor: isDark
                  ? extendedColors.blue[900] + "30"
                  : extendedColors.blue[100],
                borderColor: isDark ? extendedColors.blue[700] : extendedColors.blue[600],
              },
            ])}
          >
            <View
              style={StyleSheet.flatten([
                styles.totalIcon,
                {
                  backgroundColor: isDark
                    ? extendedColors.blue[800]
                    : extendedColors.blue[200],
                },
              ])}
            >
              <IconHash
                size={20}
                color={isDark ? extendedColors.blue[400] : extendedColors.blue[600]}
              />
            </View>
            <View style={styles.totalContent}>
              <ThemedText
                style={StyleSheet.flatten([
                  styles.totalLabel,
                  { color: isDark ? extendedColors.blue[400] : extendedColors.blue[700] },
                ])}
              >
                Total de Itens por Entrega
              </ThemedText>
              <ThemedText
                style={StyleSheet.flatten([
                  styles.totalValue,
                  { color: isDark ? extendedColors.blue[300] : extendedColors.blue[800] },
                ])}
              >
                {totalItems} item(ns)
              </ThemedText>
            </View>
          </View>

          {/* PPE Items List */}
          <View style={styles.itemsList}>
            {schedule.ppeItems.map((item, index) => (
              <View
                key={index}
                style={StyleSheet.flatten([
                  styles.itemRow,
                  {
                    backgroundColor: colors.muted + "30",
                    borderColor: colors.border,
                  },
                ])}
              >
                <View
                  style={StyleSheet.flatten([
                    styles.itemIcon,
                    {
                      backgroundColor: isDark
                        ? extendedColors.green[900]
                        : extendedColors.green[100],
                    },
                  ])}
                >
                  <IconShield
                    size={20}
                    color={isDark ? extendedColors.green[400] : extendedColors.green[600]}
                  />
                </View>
                <View style={styles.itemContent}>
                  <ThemedText
                    style={StyleSheet.flatten([styles.itemName, { color: colors.foreground }])}
                  >
                    {PPE_TYPE_LABELS[item.ppeType] || item.ppeType}
                  </ThemedText>
                  <ThemedText
                    style={StyleSheet.flatten([
                      styles.itemQuantity,
                      { color: colors.mutedForeground },
                    ])}
                  >
                    Quantidade: {item.quantity}
                  </ThemedText>
                </View>
                <Badge variant="secondary">
                  <ThemedText
                    style={{
                      color: colors.secondaryForeground,
                      fontSize: fontSize.xs,
                      fontWeight: fontWeight.bold,
                    }}
                  >
                    {item.quantity}x
                  </ThemedText>
                </Badge>
              </View>
            ))}
          </View>
        </View>
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
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    gap: spacing.md,
  },
  emptyState: {
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  totalBox: {
    flexDirection: "row",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.md,
    alignItems: "center",
  },
  totalIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  totalContent: {
    flex: 1,
  },
  totalLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs / 2,
  },
  totalValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  itemsList: {
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: "row",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.md,
    alignItems: "center",
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs / 2,
  },
  itemQuantity: {
    fontSize: fontSize.xs,
  },
});
