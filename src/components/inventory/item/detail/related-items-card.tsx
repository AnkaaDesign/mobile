
import { View, ScrollView, Pressable, StyleSheet} from "react-native";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { IconExternalLink, IconPackage, IconChevronRight } from "@tabler/icons-react-native";
import type { Item } from '../../../../types';
import { router } from "expo-router";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { itemUtils } from '../../../../utils';

interface RelatedItemsCardProps {
  item: Item;
}

export function RelatedItemsCard({ item }: RelatedItemsCardProps) {
  const { colors } = useTheme();
  const relatedItems = item.relatedItems || [];
  const relatedTo = item.relatedTo || [];
  const allRelated = [...relatedItems, ...relatedTo];

  if (allRelated.length === 0) {
    return null;
  }

  const handleItemPress = (relatedId: string) => {
    router.push(routeToMobilePath(routes.inventory.products.details(relatedId)) as any);
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconExternalLink size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Produtos Relacionados</ThemedText>
        </View>
        <Badge variant="secondary" style={{ backgroundColor: colors.muted }}>
          <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.mutedForeground }])}>{allRelated.length}</ThemedText>
        </Badge>
      </View>
      <View style={styles.content}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {allRelated.map((relatedItem) => (
            <Pressable
              key={relatedItem.id}
              onPress={() => handleItemPress(relatedItem.id)}
              style={({ pressed }) => [
                styles.relatedItemCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              {/* Item Icon */}
              <View style={StyleSheet.flatten([styles.itemIcon, { backgroundColor: colors.primary + "10" }])}>
                <IconPackage size={24} color={colors.primary} />
              </View>

              {/* Item Info */}
              <View style={styles.itemContent}>
                {/* Name and Status */}
                <View style={styles.itemHeader}>
                  <ThemedText style={StyleSheet.flatten([styles.itemName, { color: colors.foreground }])} numberOfLines={2}>
                    {relatedItem.name}
                  </ThemedText>
                  <Badge
                    variant={relatedItem.isActive ? "default" : "secondary"}
                    style={{
                      backgroundColor: relatedItem.isActive ? extendedColors.green[100] : colors.muted,
                      borderColor: relatedItem.isActive ? extendedColors.green[300] : colors.border,
                      borderWidth: 1,
                    }}
                  >
                    <ThemedText
                      style={StyleSheet.flatten([
                        styles.statusText,
                        {
                          color: relatedItem.isActive ? extendedColors.green[700] : colors.mutedForeground,
                        },
                      ])}
                    >
                      {relatedItem.isActive ? "Ativo" : "Inativo"}
                    </ThemedText>
                  </Badge>
                </View>

                {/* Brand and Category */}
                {(relatedItem.brand || relatedItem.category) && (
                  <View style={styles.itemMeta}>
                    {relatedItem.brand && (
                      <ThemedText style={StyleSheet.flatten([styles.metaText, { color: colors.mutedForeground }])} numberOfLines={1}>
                        {relatedItem.brand.name}
                      </ThemedText>
                    )}
                    {relatedItem.brand && relatedItem.category && <ThemedText style={StyleSheet.flatten([styles.metaSeparator, { color: colors.mutedForeground }])}>•</ThemedText>}
                    {relatedItem.category && (
                      <ThemedText style={StyleSheet.flatten([styles.metaText, { color: colors.mutedForeground }])} numberOfLines={1}>
                        {relatedItem.category.name}
                      </ThemedText>
                    )}
                  </View>
                )}

                {/* Stock Info */}
                <View style={styles.itemFooter}>
                  <View style={styles.stockInfo}>
                    <IconPackage size={14} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.stockText, { color: colors.mutedForeground }])}>{itemUtils.formatItemQuantity(relatedItem)} em estoque</ThemedText>
                  </View>
                  <IconChevronRight size={18} color={colors.mutedForeground} />
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Scroll Indicator for many items */}
        {allRelated.length > 2 && (
          <View style={styles.scrollIndicatorContainer}>
            <ThemedText style={StyleSheet.flatten([styles.scrollIndicator, { color: colors.mutedForeground }])}>Deslize para ver mais →</ThemedText>
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  content: {
    gap: spacing.md,
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
  badgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  scrollContent: {
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  relatedItemCard: {
    width: 200,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  itemContent: {
    flex: 1,
    gap: spacing.sm,
  },
  itemHeader: {
    gap: spacing.xs,
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    minHeight: 40,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.xs,
    flex: 1,
  },
  metaSeparator: {
    fontSize: fontSize.xs,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
  },
  stockInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  stockText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  scrollIndicatorContainer: {
    alignItems: "center",
    marginTop: spacing.sm,
  },
  scrollIndicator: {
    fontSize: fontSize.xs,
    fontStyle: "italic",
  },
});
