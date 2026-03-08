
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconRuler, IconShirt, IconShoe } from "@tabler/icons-react-native";
import { PPE_TYPE, SHIRT_SIZE_LABELS, PANTS_SIZE_LABELS, BOOT_SIZE_LABELS } from "@/constants";
import type { Item, PpeSize } from '../../../../types';
import { DetailCard } from "@/components/ui/detail-page-layout";

interface SizesCardProps {
  item: Item;
  userSizes?: PpeSize;
}

export function SizesCard({ item, userSizes }: SizesCardProps) {
  const { colors } = useTheme();

  // Determine which size fields are relevant based on PPE type
  const getSizeInfo = () => {
    if (!item.ppeType) return [];

    const sizeInfo: Array<{ label: string; value: string | null; icon: any }> = [];

    switch (item.ppeType) {
      case PPE_TYPE.SHIRT:
        if (userSizes?.shirts) {
          sizeInfo.push({
            label: "Tamanho de Camisa",
            value: SHIRT_SIZE_LABELS[userSizes.shirts],
            icon: IconShirt,
          });
        }
        break;

      case PPE_TYPE.PANTS:
        if (userSizes?.pants) {
          sizeInfo.push({
            label: "Tamanho de Calça",
            value: PANTS_SIZE_LABELS[userSizes.pants],
            icon: IconRuler,
          });
        }
        break;

      case PPE_TYPE.BOOTS:
        if (userSizes?.boots) {
          sizeInfo.push({
            label: "Tamanho de Bota",
            value: BOOT_SIZE_LABELS[userSizes.boots],
            icon: IconShoe,
          });
        }
        break;

      case PPE_TYPE.SLEEVES:
        break;

      case PPE_TYPE.MASK:
        break;

      case PPE_TYPE.GLOVES:
        break;

      case PPE_TYPE.RAIN_BOOTS:
        if (userSizes?.rainBoots) {
          sizeInfo.push({
            label: "Tamanho de Galocha",
            value: userSizes.rainBoots,
            icon: IconShoe,
          });
        }
        break;
    }

    return sizeInfo;
  };

  const sizeInfo = getSizeInfo();

  if (sizeInfo.length === 0) {
    return null;
  }

  return (
    <DetailCard title="Tamanhos Configurados" icon="ruler">
      {sizeInfo.map((size, index) => {
        const Icon = size.icon;
        return (
          <View key={index} style={StyleSheet.flatten([styles.sizeItem, { backgroundColor: colors.muted + "30" }])}>
            <View style={StyleSheet.flatten([styles.sizeIcon, { backgroundColor: colors.primary + "20" }])}>
              <Icon size={20} color={colors.primary} />
            </View>
            <View style={styles.sizeInfo}>
              <ThemedText style={StyleSheet.flatten([styles.sizeLabel, { color: colors.mutedForeground }])}>
                {size.label}
              </ThemedText>
              <Badge variant="default">
                <ThemedText style={{ color: colors.primaryForeground, fontWeight: fontWeight.semibold }}>
                  {size.value}
                </ThemedText>
              </Badge>
            </View>
          </View>
        );
      })}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  sizeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  sizeIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sizeLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
});
