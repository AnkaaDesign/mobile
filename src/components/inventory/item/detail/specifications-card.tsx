import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailField } from "@/components/ui/detail-page-layout";
import { IconInfoCircle } from "@tabler/icons-react-native";
import type { Item } from "../../../../types";
import { MEASURE_UNIT_LABELS, MEASURE_TYPE_LABELS, MEASURE_TYPE } from "@/constants";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

interface SpecificationsCardProps {
  item: Item;
}

const getMeasureIconName = (measureType: MEASURE_TYPE): string => {
  switch (measureType) {
    case MEASURE_TYPE.WEIGHT:
      return "scale";
    case MEASURE_TYPE.LENGTH:
    case MEASURE_TYPE.WIDTH:
      return "ruler";
    case MEASURE_TYPE.VOLUME:
      return "droplet";
    case MEASURE_TYPE.COUNT:
      return "hash";
    case MEASURE_TYPE.DIAMETER:
      return "circle";
    case MEASURE_TYPE.ELECTRICAL:
      return "bolt";
    default:
      return "box";
  }
};

export function SpecificationsCard({ item }: SpecificationsCardProps) {
  const { colors } = useTheme();

  const hasProductInfo = item.brand || item.category || item.supplier;
  const hasIdentification = item.uniCode || item.ppeCA || (item.barcodes && item.barcodes.length > 0);
  const hasMeasures = item.measures && item.measures.length > 0;
  const hasPackaging = item.boxQuantity !== null;
  const hasLogistics = item.estimatedLeadTime !== null;

  if (!hasProductInfo && !hasIdentification && !hasMeasures && !hasPackaging && !hasLogistics) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconInfoCircle size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Especificações Técnicas</ThemedText>
        </View>
        <Badge
          variant={item.isActive ? "default" : "destructive"}
        >
          <ThemedText
            style={StyleSheet.flatten([
              styles.badgeText,
              { color: item.isActive ? colors.primaryForeground : colors.destructiveForeground },
            ])}
          >
            {item.isActive ? "Ativo" : "Inativo"}
          </ThemedText>
        </Badge>
      </View>
      <View style={styles.content}>
        {item.uniCode && (
          <DetailField
            label="Código Universal"
            value={item.uniCode}
            icon="hash"
          />
        )}

        {item.brand && (
          <DetailField
            label="Marca"
            value={item.brand.name}
            icon="tag"
          />
        )}

        {item.category && (
          <DetailField
            label="Categoria"
            value={item.category.name}
            icon="category"
          />
        )}

        {item.supplier && (
          <DetailField
            label="Fornecedor"
            value={item.supplier.fantasyName}
            icon="building"
          />
        )}

        {item.ppeCA && (
          <DetailField
            label="Certificado de Aprovação (CA)"
            value={item.ppeCA}
            icon="certificate"
          />
        )}

        {item.barcodes && item.barcodes.length > 0 && item.barcodes.map((barcode, index) => (
          <DetailField
            key={index}
            label={`Código de Barras${item.barcodes!.length > 1 ? ` ${index + 1}` : ""}`}
            value={barcode}
            icon="barcode"
          />
        ))}

        {item.measures && item.measures.length > 0 && item.measures.map((measure, index) => (
          <DetailField
            key={`measure-${index}`}
            label={MEASURE_TYPE_LABELS[measure.measureType]}
            value={`${measure.value?.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ${measure.unit ? MEASURE_UNIT_LABELS[measure.unit] : ""}`}
            icon={getMeasureIconName(measure.measureType)}
          />
        ))}

        {item.boxQuantity !== null && (
          <DetailField
            label="Unidades por Caixa"
            value={String(item.boxQuantity)}
            icon="box"
          />
        )}

        {item.estimatedLeadTime !== null && (
          <DetailField
            label="Prazo de Entrega Estimado"
            value={`${item.estimatedLeadTime} dias`}
            icon="truck"
          />
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
    gap: spacing.md,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
