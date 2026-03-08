import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconBox, IconExternalLink } from "@tabler/icons-react-native";
import type { Borrow } from "@/types";
import { router } from "expo-router";
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { formatQuantity } from "@/utils";
import { Icon } from "@/components/ui/icon";

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
      <DetailCard title="Item Emprestado" icon="box">
        <View style={styles.emptyState}>
          <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted + "30" }])}>
            <IconBox size={32} color={colors.mutedForeground} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.emptyTitle, { color: colors.foreground }])}>
            Item não encontrado
          </ThemedText>
          <ThemedText style={StyleSheet.flatten([styles.emptyDescription, { color: colors.mutedForeground }])}>
            As informações do item não estão disponíveis.
          </ThemedText>
        </View>
      </DetailCard>
    );
  }

  return (
    <DetailCard title="Item Emprestado" icon="box">
      {/* Item Name */}
      <TouchableOpacity onPress={handleNavigateToItem} activeOpacity={0.7}>
        <DetailField
          label="Nome do Item"
          icon="package"
          value={
            <View style={styles.nameRow}>
              <ThemedText style={[styles.nameText, { color: colors.foreground }]}>
                {borrow.item.name}
              </ThemedText>
              <IconExternalLink size={14} color={colors.primary} />
            </View>
          }
        />
      </TouchableOpacity>

      {borrow.item.uniCode && (
        <DetailField label="Código" icon="barcode" value={borrow.item.uniCode} monospace />
      )}

      {borrow.item.category?.name && (
        <DetailField label="Categoria" icon="folder" value={borrow.item.category.name} />
      )}

      {borrow.item.brand?.name && (
        <DetailField label="Marca" icon="tag" value={borrow.item.brand.name} />
      )}

      {borrow.item.quantity !== undefined && (
        <DetailField label="Estoque Atual" icon="package" value={formatQuantity(borrow.item.quantity)} />
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nameText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
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
    fontWeight: fontWeight.semibold,
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});
