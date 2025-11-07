
import { View, StyleSheet} from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { IconShirt, IconShoe, IconBoxSeam, IconMask, IconBulb, IconCertificate, IconPackage, IconCalendar, IconUser, IconRuler } from "@tabler/icons-react-native";
import type { Item } from '../../../../types';
import { PPE_TYPE_LABELS, PPE_SIZE_LABELS, PPE_DELIVERY_MODE_LABELS, PPE_TYPE } from '../../../../constants';
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";

interface PpeInfoCardProps {
  item: Item;
}

const getPpeIcon = (ppeType: PPE_TYPE) => {
  switch (ppeType) {
    case PPE_TYPE.SHIRT:
      return IconShirt;
    case PPE_TYPE.BOOTS:
      return IconShoe;
    case PPE_TYPE.PANTS:
      return IconBoxSeam;
    case PPE_TYPE.MASK:
      return IconMask;
    case PPE_TYPE.SLEEVES:
      return IconBulb;
    default:
      return IconShirt;
  }
};

export function PpeInfoCard({ item }: PpeInfoCardProps) {
  const { colors } = useTheme();

  // Check if item has PPE configuration
  if (!item.ppeType) {
    return null;
  }

  const Icon = getPpeIcon(item.ppeType);

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Informações de EPI</ThemedText>
      </View>
      <View style={styles.content}>
        <View style={styles.innerContent}>
          {/* PPE Type and Size */}
          <View>
            <ThemedText style={StyleSheet.flatten([styles.subSectionHeader, { color: colors.foreground }])}>Tipo de EPI</ThemedText>
            <View style={styles.sectionContent}>
              <View style={StyleSheet.flatten([styles.infoRow, { backgroundColor: colors.muted + "50" }])}>
                <View style={styles.labelContainer}>
                  <Icon size={16} color={colors.mutedForeground} />
                  <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Tipo</ThemedText>
                </View>
                <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>{PPE_TYPE_LABELS[item.ppeType]}</ThemedText>
              </View>
              {item.ppeSize && (
                <View style={StyleSheet.flatten([styles.infoRow, { backgroundColor: colors.muted + "50" }])}>
                  <View style={styles.labelContainer}>
                    <IconRuler size={16} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Tamanho</ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>{PPE_SIZE_LABELS[item.ppeSize]}</ThemedText>
                </View>
              )}
              {item.ppeCA && (
                <View style={StyleSheet.flatten([styles.infoRow, { backgroundColor: colors.muted + "50" }])}>
                  <View style={styles.labelContainer}>
                    <IconCertificate size={16} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Certificado de Aprovação (CA)</ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>{item.ppeCA}</ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Delivery Configuration */}
          <View style={StyleSheet.flatten([styles.divider, { borderTopColor: colors.border + "50" }])} />
          <View>
            <ThemedText style={StyleSheet.flatten([styles.subSectionHeader, { color: colors.foreground }])}>Configuração de Entrega</ThemedText>
            <View style={styles.deliveryGrid}>
              <View style={styles.deliveryRow}>
                <View style={styles.deliveryItem}>
                  <View style={styles.labelContainer}>
                    <IconPackage size={16} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.deliveryLabel, { color: colors.mutedForeground }])} numberOfLines={1}>
                      Modo de Entrega
                    </ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.deliveryValue, { color: colors.foreground }])}>{item.ppeDeliveryMode && PPE_DELIVERY_MODE_LABELS[item.ppeDeliveryMode]}</ThemedText>
                </View>

                <View style={styles.deliveryItem}>
                  <View style={styles.labelContainer}>
                    <IconUser size={16} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.deliveryLabel, { color: colors.mutedForeground }])} numberOfLines={1}>
                      Atribuído ao Usuário
                    </ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.deliveryValue, { color: colors.foreground }])}>{item.shouldAssignToUser ? "Sim" : "Não"}</ThemedText>
                </View>
              </View>

              <View style={styles.deliveryRow}>
                <View style={styles.deliveryItem}>
                  <View style={styles.labelContainer}>
                    <IconPackage size={16} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.deliveryLabel, { color: colors.mutedForeground }])} numberOfLines={1}>
                      Qtd. Padrão
                    </ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.deliveryValueLarge, { color: colors.foreground }])}>{item.ppeStandardQuantity}</ThemedText>
                </View>
              </View>
            </View>
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
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  content: {
    gap: spacing.md,
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  innerContent: {
    gap: spacing.lg,
  },
  subSectionHeader: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  sectionContent: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  divider: {
    paddingTop: spacing.lg,
    marginTop: spacing.lg,
    borderTopWidth: 1,
  },
  deliveryGrid: {
    gap: spacing.lg,
  },
  deliveryRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  deliveryItem: {
    flex: 1,
    gap: spacing.xs,
  },
  deliveryLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  deliveryValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
    marginLeft: spacing.md + 4, // Align with icon
  },
  deliveryValueLarge: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.xs,
    marginLeft: spacing.md + 4, // Align with icon
  },
});
