import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import {
  IconInfoCircle,
  IconRuler,
  IconUserCheck,
  IconBadge,
  IconTruck,
  IconBox,
  IconQrcode,
  IconScale,
  IconDroplet,
  IconHash,
} from "@tabler/icons-react-native";
import type { Item } from "../../../../types";
import { MEASURE_UNIT_LABELS, MEASURE_TYPE_LABELS, MEASURE_TYPE } from "@/constants";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";

interface SpecificationsCardProps {
  item: Item;
}

export function SpecificationsCard({ item }: SpecificationsCardProps) {
  const { colors } = useTheme();

  // Check if we have any specifications to show
  const hasProductInfo = item.brand || item.category || item.supplier;
  const hasIdentification = item.uniCode || item.ppeCA || (item.barcodes && item.barcodes.length > 0);
  const hasMeasures = item.measures && item.measures.length > 0;
  const hasPackaging = item.boxQuantity !== null;
  const hasLogistics = item.estimatedLeadTime !== null;

  const getMeasureTypeIcon = (measureType: MEASURE_TYPE) => {
    const iconProps = { size: 16, color: colors.mutedForeground };

    switch (measureType) {
      case MEASURE_TYPE.WEIGHT:
        return <IconScale {...iconProps} />;
      case MEASURE_TYPE.LENGTH:
        return <IconRuler {...iconProps} />;
      case MEASURE_TYPE.VOLUME:
        return <IconDroplet {...iconProps} />;
      case MEASURE_TYPE.COUNT:
        return <IconHash {...iconProps} />;
      default:
        return <IconBox {...iconProps} />;
    }
  };

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
        <View style={styles.specificationsContent}>
          {/* Product Information */}
          {hasProductInfo && (
            <View style={styles.specSection}>
              <ThemedText style={StyleSheet.flatten([styles.specSectionTitle, { color: colors.foreground }])}>Informações do Produto</ThemedText>
              <View style={styles.specItems}>
                <View style={StyleSheet.flatten([styles.specItem, { backgroundColor: colors.muted + "30" }])}>
                  <ThemedText style={StyleSheet.flatten([styles.specLabel, { color: colors.mutedForeground }])}>Marca</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.specValue, { color: item.brand ? colors.foreground : colors.mutedForeground }, !item.brand && styles.specValueItalic])}>
                    {item.brand ? item.brand.name : "Não definida"}
                  </ThemedText>
                </View>
                <View style={StyleSheet.flatten([styles.specItem, { backgroundColor: colors.muted + "30" }])}>
                  <ThemedText style={StyleSheet.flatten([styles.specLabel, { color: colors.mutedForeground }])}>Categoria</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.specValue, { color: item.category ? colors.foreground : colors.mutedForeground }, !item.category && styles.specValueItalic])}>
                    {item.category ? item.category.name : "Não definida"}
                  </ThemedText>
                </View>
                {item.supplier && (
                  <View style={StyleSheet.flatten([styles.specItem, { backgroundColor: colors.muted + "30" }])}>
                    <ThemedText style={StyleSheet.flatten([styles.specLabel, { color: colors.mutedForeground }])}>Fornecedor</ThemedText>
                    <ThemedText style={StyleSheet.flatten([styles.specValue, { color: colors.foreground }])}>{item.supplier.fantasyName}</ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Identification */}
          {hasIdentification && (
            <View style={StyleSheet.flatten([styles.specSection, hasProductInfo && styles.specSectionBorder, hasProductInfo && { borderTopColor: colors.border + "50" }])}>
              <ThemedText style={StyleSheet.flatten([styles.specSectionTitle, { color: colors.foreground }])}>Identificação</ThemedText>
              <View style={styles.specItems}>
                {item.uniCode && (
                  <View style={StyleSheet.flatten([styles.specItem, { backgroundColor: colors.muted + "30" }])}>
                    <ThemedText style={StyleSheet.flatten([styles.specLabel, { color: colors.mutedForeground }])}>Código Universal</ThemedText>
                    <ThemedText style={StyleSheet.flatten([styles.specValue, { color: colors.foreground }])}>{item.uniCode}</ThemedText>
                  </View>
                )}

                {item.ppeCA && (
                  <View style={StyleSheet.flatten([styles.specItem, { backgroundColor: colors.muted + "30" }])}>
                    <ThemedText style={StyleSheet.flatten([styles.specLabel, { color: colors.mutedForeground }])}>Certificado de Aprovação (CA)</ThemedText>
                    <ThemedText style={StyleSheet.flatten([styles.specValue, { color: colors.foreground }])}>{item.ppeCA}</ThemedText>
                  </View>
                )}

                {item.barcodes && item.barcodes.length > 0 && item.barcodes.map((barcode, index) => (
                  <View key={index} style={StyleSheet.flatten([styles.specItem, { backgroundColor: colors.muted + "30" }])}>
                    <ThemedText style={StyleSheet.flatten([styles.specLabel, { color: colors.mutedForeground }])}>
                      Código de Barras{item.barcodes!.length > 1 ? ` ${index + 1}` : ""}
                    </ThemedText>
                    <ThemedText style={StyleSheet.flatten([styles.specValue, { color: colors.foreground }])}>{barcode}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Measures */}
          {hasMeasures && (
            <View style={StyleSheet.flatten([styles.specSection, (hasProductInfo || hasIdentification) && styles.specSectionBorder, (hasProductInfo || hasIdentification) && { borderTopColor: colors.border + "50" }])}>
              <ThemedText style={StyleSheet.flatten([styles.specSectionTitle, { color: colors.foreground }])}>Medidas do Produto</ThemedText>
              <View style={styles.measuresContainer}>
                {item.measures!.map((measure, index) => (
                  <View key={index} style={StyleSheet.flatten([styles.measureCard, { backgroundColor: colors.muted + "20" }])}>
                    <View style={styles.measureHeader}>
                      <View style={styles.measureTypeInfo}>
                        {getMeasureTypeIcon(measure.measureType)}
                        <ThemedText style={StyleSheet.flatten([styles.measureTypeLabel, { color: colors.mutedForeground }])}>{MEASURE_TYPE_LABELS[measure.measureType]}</ThemedText>
                      </View>
                      <ThemedText style={StyleSheet.flatten([styles.measureMainValue, { color: colors.foreground }])}>
                        {measure.value?.toLocaleString("pt-BR")} {measure.unit ? MEASURE_UNIT_LABELS[measure.unit] : ""}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Packaging */}
          {hasPackaging && (
            <View style={StyleSheet.flatten([styles.specSection, styles.specSectionBorder, { borderTopColor: colors.border + "50" }])}>
              <ThemedText style={StyleSheet.flatten([styles.specSectionTitle, { color: colors.foreground }])}>Embalagem</ThemedText>
              <View style={styles.specPackaging}>
                {item.boxQuantity !== null && (
                  <View style={styles.specPackageItem}>
                    <View style={styles.specIdHeader}>
                      <IconBox size={16} color={colors.mutedForeground} />
                      <ThemedText style={StyleSheet.flatten([styles.specIdLabel, { color: colors.mutedForeground }])}>Unidades por Caixa</ThemedText>
                    </View>
                    <ThemedText style={StyleSheet.flatten([styles.specPackageValue, { color: colors.foreground }])}>{item.boxQuantity}</ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Logistics */}
          {hasLogistics && (
            <View style={StyleSheet.flatten([styles.specSection, styles.specSectionBorder, { borderTopColor: colors.border + "50" }])}>
              <ThemedText style={StyleSheet.flatten([styles.specSectionTitle, { color: colors.foreground }])}>Logística</ThemedText>
              <View style={styles.specLogistics}>
                <View style={styles.specIdHeader}>
                  <IconTruck size={16} color={colors.mutedForeground} />
                  <ThemedText style={StyleSheet.flatten([styles.specIdLabel, { color: colors.mutedForeground }])}>Prazo de Entrega Estimado</ThemedText>
                </View>
                <ThemedText style={StyleSheet.flatten([styles.specPackageValue, { color: colors.foreground }])}>{item.estimatedLeadTime} dias</ThemedText>
              </View>
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
  specificationsContent: {
    gap: spacing.xl,
  },
  specSection: {
    gap: spacing.md,
  },
  specSectionBorder: {
    borderTopWidth: 1,
    paddingTop: spacing.xl,
  },
  specSectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  specItems: {
    gap: spacing.md,
  },
  specItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  specLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  specValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: "right",
  },
  specPackaging: {
    gap: spacing.lg,
  },
  specPackageItem: {
    gap: spacing.xs,
  },
  specPackageValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.xs,
  },
  specLogistics: {
    gap: spacing.xs,
  },
  specValueItalic: {
    fontStyle: "italic",
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  measuresContainer: {
    gap: spacing.md,
  },
  measureCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  measureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  measureTypeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  measureTypeLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  measureMainValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});
