import React from "react";
import { View, Platform, StyleSheet} from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import {
  IconInfoCircle,
  IconRuler,
  IconId,
  IconUserCheck,
  IconBadge,
  IconTruck,
  IconBox,
  IconBuilding,
  IconQrcode,
  IconCircleCheck,
  IconCircleX,
  IconScale,
  IconDroplet,
  IconHash,
} from "@tabler/icons-react-native";
import type { Item } from '../../../../types';
import { MEASURE_UNIT_LABELS, MEASURE_TYPE_LABELS, MEASURE_TYPE } from '../../../../constants';
import { getMeasureUnitCategory, convertValue, canConvertUnits, getUnitsInCategory, MEASURE_CATEGORIES } from '../../../../types/measure';
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";

interface SpecificationsCardProps {
  item: Item;
}

export function SpecificationsCard({ item }: SpecificationsCardProps) {
  const { colors } = useTheme();

  // Check if we have any specifications to show
  const hasProductInfo = item.brand || item.category || item.supplier;
  const hasIdentification = item.uniCode || (item as any).ppeConfig?.ca || (item.barcodes && item.barcodes.length > 0);
  const hasMeasures = item.measures && item.measures.length > 0;
  const hasPackaging = item.boxQuantity !== null;
  const hasLogistics = item.estimatedLeadTime !== null;
  const hasStatus = true; // Always show status section

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

  const getConversionOptions = (measure: any) => {
    const compatibleUnits = getUnitsInCategory(getMeasureUnitCategory(measure.unit))
      .filter((unit) => unit !== measure.unit && canConvertUnits(measure.unit, unit))
      .slice(0, 2); // Show only first 2 conversions

    return compatibleUnits
      .map((unit) => {
        const converted = convertValue(measure.value, measure.unit, unit);
        return {
          unit,
          value: converted,
          label: MEASURE_UNIT_LABELS[unit] || unit,
        };
      })
      .filter((conversion) => conversion.value !== null);
  };

  if (!hasProductInfo && !hasIdentification && !hasMeasures && !hasPackaging && !hasLogistics && !hasStatus) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconInfoCircle size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Especificações Técnicas</ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.specificationsContent}>
          {/* Status Information */}
          <View style={styles.specSection}>
            <ThemedText style={StyleSheet.flatten([styles.specSectionTitle, { color: colors.foreground }])}>Status</ThemedText>
            <View style={styles.specItems}>
              <View style={StyleSheet.flatten([styles.specItem, { backgroundColor: colors.muted + "30" }])}>
                <ThemedText style={StyleSheet.flatten([styles.specLabel, { color: colors.mutedForeground }])}>Estado</ThemedText>
                <View style={styles.statusBadgeContainer}>
                  <Badge variant={item.isActive ? "success" : "secondary"}>
                    <View style={styles.badgeContent}>
                      {item.isActive ? <IconCircleCheck size={14} color={colors.primaryForeground} /> : <IconCircleX size={14} color={colors.primaryForeground} />}
                      <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>{item.isActive ? "Ativo" : "Inativo"}</ThemedText>
                    </View>
                  </Badge>
                </View>
              </View>
            </View>
          </View>

          {/* Product Information */}
          {hasProductInfo && (
            <View style={StyleSheet.flatten([styles.specSection, styles.specSectionBorder, { borderTopColor: colors.border + "50" }])}>
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
            <View style={StyleSheet.flatten([styles.specSection, styles.specSectionBorder, { borderTopColor: colors.border + "50" }])}>
              <ThemedText style={StyleSheet.flatten([styles.specSectionTitle, { color: colors.foreground }])}>Identificação</ThemedText>
              <View style={styles.specIdentification}>
                {item.uniCode && (
                  <View>
                    <View style={styles.specIdHeader}>
                      <IconUserCheck size={16} color={colors.mutedForeground} />
                      <ThemedText style={StyleSheet.flatten([styles.specIdLabel, { color: colors.mutedForeground }])}>Código Universal</ThemedText>
                    </View>
                    <View style={StyleSheet.flatten([styles.specIdValue, { backgroundColor: colors.muted + "30" }])}>
                      <ThemedText style={{ fontSize: fontSize.base, color: colors.foreground }}>{item.uniCode}</ThemedText>
                    </View>
                  </View>
                )}

                {(item as any).ppeConfig?.ca && (
                  <View>
                    <View style={styles.specIdHeader}>
                      <IconBadge size={16} color={colors.mutedForeground} />
                      <ThemedText style={StyleSheet.flatten([styles.specIdLabel, { color: colors.mutedForeground }])}>Certificado de Aprovação (CA)</ThemedText>
                    </View>
                    <View style={StyleSheet.flatten([styles.specIdValue, { backgroundColor: colors.muted + "30" }])}>
                      <ThemedText style={{ fontSize: fontSize.base, color: colors.foreground }}>{(item as any).ppeConfig.ca}</ThemedText>
                    </View>
                  </View>
                )}

                {item.barcodes && item.barcodes.length > 0 && (
                  <View>
                    <View style={styles.specIdHeader}>
                      <IconQrcode size={16} color={colors.mutedForeground} />
                      <ThemedText style={StyleSheet.flatten([styles.specIdLabel, { color: colors.mutedForeground }])}>Códigos de Barras</ThemedText>
                    </View>
                    <View style={styles.barcodeList}>
                      {item.barcodes.map((barcode, index) => (
                        <View key={index} style={StyleSheet.flatten([styles.barcodeItem, { backgroundColor: colors.muted + "30" }])}>
                          <ThemedText style={{ fontSize: fontSize.base, color: colors.foreground }}>{barcode}</ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Measures */}
          {hasMeasures && (
            <View style={StyleSheet.flatten([styles.specSection, styles.specSectionBorder, { borderTopColor: colors.border + "50" }])}>
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
                        {measure.value.toLocaleString("pt-BR")} {MEASURE_UNIT_LABELS[measure.unit]}
                      </ThemedText>
                    </View>

                    {/* Conversion Options */}
                    {getConversionOptions(measure).length > 0 && (
                      <View style={styles.conversionsContainer}>
                        <ThemedText style={StyleSheet.flatten([styles.conversionsLabel, { color: colors.mutedForeground }])}>Conversões:</ThemedText>
                        <View style={styles.conversionsList}>
                          {getConversionOptions(measure).map((conversion, convIndex) => (
                            <Badge key={convIndex} variant="secondary" style={styles.conversionBadge}>
                              <ThemedText style={StyleSheet.flatten([styles.conversionText, { color: colors.mutedForeground }])}>
                                ≈ {conversion.value!.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} {conversion.label}
                              </ThemedText>
                            </Badge>
                          ))}
                        </View>
                      </View>
                    )}
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
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
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
  specIdentification: {
    gap: spacing.lg,
  },
  specIdHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  specIdLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  specIdValue: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: "flex-start",
  },
  monoText: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: fontSize.base,
  },
  barcodeList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  barcodeItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
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
  statusBadgeContainer: {
    alignItems: "flex-end",
  },
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
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
  conversionsContainer: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  conversionsLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  conversionsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  conversionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  conversionText: {
    fontSize: fontSize.xs,
  },
});
