import { View, StyleSheet } from "react-native";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { spacing } from "@/constants/design-system";
import { WAREHOUSE_LOCATION_TYPE_LABELS } from "@/constants/enum-labels";
import type { WarehouseLocation } from "@/types";

interface BasicInfoCardProps {
  location: WarehouseLocation;
}

export function BasicInfoCard({ location }: BasicInfoCardProps) {
  return (
    <DetailCard title="Informações Básicas" icon="location">
      <View style={styles.fieldsContainer}>
        <DetailField label="Nome" value={location.name} icon="location" />

        {location.type && (
          <DetailField label="Tipo" value={WAREHOUSE_LOCATION_TYPE_LABELS[location.type] ?? location.type} icon="category" />
        )}

        {location.section && (
          <DetailField label="Setor" value={location.section} icon="category" />
        )}

        {location.code && (
          <DetailField label="Código" value={location.code} icon="barcode" />
        )}

        <DetailField label="Níveis" value={String(location.levels ?? 1)} icon="info" />

        <DetailField label="Colunas" value={String(location.columns ?? 1)} icon="info" />

        {location.columnsPerLevel && location.columnsPerLevel.length > 0 && (
          <DetailField
            label="Colunas por Nível"
            value={location.columnsPerLevel.map((c, i) => `N${i + 1}: ${c}`).join("  ")}
            icon="info"
          />
        )}

        {location.description && (
          <DetailField label="Descrição" value={location.description} icon="info" />
        )}

        <DetailField label="Ativo" value={location.isActive ? "Sim" : "Não"} icon="info" />
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  fieldsContainer: {
    gap: spacing.md,
  },
});
