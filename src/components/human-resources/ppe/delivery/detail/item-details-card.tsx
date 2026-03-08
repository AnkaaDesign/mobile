
import { StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { PPE_TYPE_LABELS } from "@/constants";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { fontSize, fontWeight } from "@/constants/design-system";
import type { PpeDelivery } from '../../../../../types';

interface ItemDetailsCardProps {
  delivery: PpeDelivery;
}

export function ItemDetailsCard({ delivery }: ItemDetailsCardProps) {
  const item = delivery.item;

  if (!item) {
    return null;
  }

  return (
    <DetailCard title="Detalhes do EPI" icon="box">
      <DetailField label="Item" icon="tag" value={item.name} />

      {item.ppeType && (
        <DetailField
          label="Tipo de EPI"
          icon="shield"
          value={
            <Badge variant="secondary">
              <ThemedText style={styles.badgeText}>{PPE_TYPE_LABELS[item.ppeType]}</ThemedText>
            </Badge>
          }
        />
      )}

      {item.ppeCA && (
        <DetailField label="CA" icon="shield" value={item.ppeCA} />
      )}

      {item.category?.name && (
        <DetailField label="Categoria" icon="tag" value={item.category.name} />
      )}

      {item.brand?.name && (
        <DetailField label="Marca" icon="tag" value={item.brand.name} />
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
