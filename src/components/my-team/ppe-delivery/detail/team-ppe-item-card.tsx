import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import type { PpeDelivery } from '@/types';
import { formatQuantity } from "@/utils";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";

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
    <DetailCard title="Item EPI" icon="package">
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

      {item.brand && (
        <DetailField label="Marca" icon="tag" value={item.brand.name} />
      )}

      {item.category && (
        <DetailField label="Categoria" icon="tag" value={item.category.name} />
      )}

      {item.ppeCA && (
        <DetailField label="CA" icon="certificate" value={item.ppeCA} />
      )}

      <DetailField
        label="Quantidade"
        icon="barcode"
        value={formatQuantity(delivery.quantity || 1)}
      />
    </DetailCard>
  );
}

const styles = StyleSheet.create({
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
});
