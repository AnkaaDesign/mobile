import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconShirt } from "@tabler/icons-react-native";
import { Icon } from "@/components/ui/icon";
import type { User } from '../../../../types';
import {
  SHIRT_SIZE_LABELS,
  BOOT_SIZE_LABELS,
  PANTS_SIZE_LABELS,
  SLEEVES_SIZE_LABELS,
  MASK_SIZE_LABELS,
  GLOVES_SIZE_LABELS,
  RAIN_BOOTS_SIZE_LABELS,
} from "@/constants";
import { DetailCard } from "@/components/ui/detail-page-layout";

interface UserPpeSizesCardProps {
  user: User;
}

// Format numeric size with "Nº" prefix for boots/pants
const formatNumericSize = (label: string | undefined, raw: string): string => {
  if (!label) return raw;
  // If the label is just a number, prefix with "Nº"
  if (/^\d+$/.test(label)) return `Nº ${label}`;
  return label;
};

interface SizeItemProps {
  label: string;
  value: string;
  icon: string;
}

function SizeItem({ label, value, icon }: SizeItemProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.sizeItem, { backgroundColor: colors.muted, borderColor: colors.border }]}>
      <View style={styles.sizeHeader}>
        <Icon name={icon} size={16} color={colors.mutedForeground} />
        <ThemedText style={[styles.sizeLabel, { color: colors.mutedForeground }]}>
          {label}
        </ThemedText>
      </View>
      <ThemedText style={[styles.sizeValue, { color: colors.foreground }]}>
        {value}
      </ThemedText>
    </View>
  );
}

export function UserPpeSizesCard({ user }: UserPpeSizesCardProps) {
  const { colors } = useTheme();

  const hasPpeSizes = user.ppeSize && (
    user.ppeSize.shirts ||
    user.ppeSize.boots ||
    user.ppeSize.pants ||
    user.ppeSize.shorts ||
    user.ppeSize.sleeves ||
    user.ppeSize.mask ||
    user.ppeSize.gloves ||
    user.ppeSize.rainBoots
  );

  return (
    <DetailCard title="Tamanhos de EPI" icon="shirt">
      {!hasPpeSizes ? (
        <View style={styles.emptyState}>
          <IconShirt size={48} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
          <ThemedText style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
            Nenhum tamanho de EPI cadastrado
          </ThemedText>
        </View>
      ) : (
        <View style={styles.sizesGrid}>
          {user.ppeSize?.shirts && (
            <SizeItem
              label="Camisa"
              value={SHIRT_SIZE_LABELS[user.ppeSize.shirts] || user.ppeSize.shirts}
              icon="shirt"
            />
          )}

          {user.ppeSize?.pants && (
            <SizeItem
              label="Calça"
              value={formatNumericSize(PANTS_SIZE_LABELS[user.ppeSize.pants], user.ppeSize.pants)}
              icon="hanger"
            />
          )}

          {user.ppeSize?.shorts && (
            <SizeItem
              label="Bermuda"
              value={formatNumericSize(PANTS_SIZE_LABELS[user.ppeSize.shorts], user.ppeSize.shorts)}
              icon="hanger"
            />
          )}

          {user.ppeSize?.boots && (
            <SizeItem
              label="Botas"
              value={formatNumericSize(BOOT_SIZE_LABELS[user.ppeSize.boots], user.ppeSize.boots)}
              icon="shoe"
            />
          )}

          {user.ppeSize?.rainBoots && (
            <SizeItem
              label="Galocha"
              value={formatNumericSize(RAIN_BOOTS_SIZE_LABELS[user.ppeSize.rainBoots], user.ppeSize.rainBoots)}
              icon="umbrella"
            />
          )}

          {user.ppeSize?.sleeves && (
            <SizeItem
              label="Manguito"
              value={SLEEVES_SIZE_LABELS[user.ppeSize.sleeves] || user.ppeSize.sleeves}
              icon="hanger"
            />
          )}

          {user.ppeSize?.mask && (
            <SizeItem
              label="Máscara"
              value={MASK_SIZE_LABELS[user.ppeSize.mask] || user.ppeSize.mask}
              icon="mask"
            />
          )}

          {user.ppeSize?.gloves && (
            <SizeItem
              label="Luvas"
              value={GLOVES_SIZE_LABELS[user.ppeSize.gloves] || user.ppeSize.gloves}
              icon="hand-grab"
            />
          )}
        </View>
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  sizesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  sizeItem: {
    flex: 1,
    minWidth: "45%",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.sm,
    gap: spacing.xxs,
  },
  sizeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  sizeLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  sizeValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.xs + 16, // align with label text (icon width 16 + gap)
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
    gap: spacing.md,
  },
  emptyStateText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
