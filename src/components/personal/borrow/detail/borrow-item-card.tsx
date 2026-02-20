import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconBox, IconExternalLink } from "@tabler/icons-react-native";
import type { Borrow } from "@/types";
import { router } from "expo-router";
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { formatQuantity } from "@/utils";

interface BorrowItemCardProps {
  borrow: Borrow;
}

export function BorrowItemCard({ borrow }: BorrowItemCardProps) {
  const { colors } = useTheme();

  const handleNavigateToItem = () => {
    if (borrow.item?.id) {
      router.push(routeToMobilePath(routes.inventory.products.details(borrow.item.id)) as any);
    }
  };

  if (!borrow.item) {
    return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconBox size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Item Emprestado</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted + "30" }]}>
              <IconBox size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={[styles.emptyTitle, { color: colors.foreground }]}>
              Item não encontrado
            </ThemedText>
            <ThemedText style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
              As informações do item não estão disponíveis.
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
          <IconBox size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Item Emprestado</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Item Name with Link */}
        <TouchableOpacity
          onPress={handleNavigateToItem}
          style={[styles.itemNameContainer, { backgroundColor: colors.muted + "30" }]}
          activeOpacity={0.7}
        >
          <View style={styles.itemNameContent}>
            <IconBox size={16} color={colors.mutedForeground} />
            <View style={styles.itemTextContainer}>
              <ThemedText style={[styles.itemLabel, { color: colors.mutedForeground }]}>
                Nome do Item
              </ThemedText>
              <ThemedText style={[styles.itemName, { color: colors.foreground }]}>
                {borrow.item.name}
              </ThemedText>
            </View>
          </View>
          <IconExternalLink size={16} color={colors.primary} />
        </TouchableOpacity>

        {/* Item Details */}
        <View style={styles.fieldsContainer}>
          {borrow.item.uniCode && (
            <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Código
              </ThemedText>
              <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
                {borrow.item.uniCode}
              </ThemedText>
            </View>
          )}

          {borrow.item.category?.name && (
            <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Categoria
              </ThemedText>
              <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
                {borrow.item.category.name}
              </ThemedText>
            </View>
          )}

          {borrow.item.brand?.name && (
            <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Marca
              </ThemedText>
              <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
                {borrow.item.brand.name}
              </ThemedText>
            </View>
          )}

          {borrow.item.quantity !== undefined && (
            <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Estoque Atual
              </ThemedText>
              <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
                {formatQuantity(borrow.item.quantity)}
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
    gap: spacing.xl,
  },
  itemNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  itemNameContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    flex: 1,
  },
  itemTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  itemLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  fieldsContainer: {
    gap: spacing.md,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  fieldValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: "right",
    flex: 1,
    marginLeft: spacing.md,
  },
  descriptionSection: {
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  subsectionHeader: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  descriptionText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
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
    fontWeight: fontWeight.semibold,
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});
