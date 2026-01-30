import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import {
  IconShirt,
  IconShoe,
  IconHanger,
  IconMask,
  IconHandGrab,
  IconUmbrella
} from "@tabler/icons-react-native";
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

interface UserPpeSizesCardProps {
  user: User;
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
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconShirt size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Tamanhos de EPI</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {!hasPpeSizes ? (
          <View style={styles.emptyState}>
            <IconShirt size={48} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
            <ThemedText style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
              Nenhum tamanho de EPI cadastrado
            </ThemedText>
          </View>
        ) : (
          <View style={styles.sizesGrid}>
            {/* Shirts */}
            {user.ppeSize?.shirts && (
              <View style={styles.sizeItem}>
                <View style={styles.sizeItemHeader}>
                  <IconShirt size={18} color={colors.mutedForeground} />
                  <ThemedText style={[styles.sizeLabel, { color: colors.mutedForeground }]}>
                    Camisa
                  </ThemedText>
                </View>
                <ThemedText style={[styles.sizeValue, { color: colors.foreground }]}>
                  {SHIRT_SIZE_LABELS[user.ppeSize.shirts]}
                </ThemedText>
              </View>
            )}

            {/* Pants */}
            {user.ppeSize?.pants && (
              <View style={styles.sizeItem}>
                <View style={styles.sizeItemHeader}>
                  <IconHanger size={18} color={colors.mutedForeground} />
                  <ThemedText style={[styles.sizeLabel, { color: colors.mutedForeground }]}>
                    Calça
                  </ThemedText>
                </View>
                <ThemedText style={[styles.sizeValue, { color: colors.foreground }]}>
                  {PANTS_SIZE_LABELS[user.ppeSize.pants]}
                </ThemedText>
              </View>
            )}

            {/* Shorts */}
            {user.ppeSize?.shorts && (
              <View style={styles.sizeItem}>
                <View style={styles.sizeItemHeader}>
                  <IconHanger size={18} color={colors.mutedForeground} />
                  <ThemedText style={[styles.sizeLabel, { color: colors.mutedForeground }]}>
                    Bermuda
                  </ThemedText>
                </View>
                <ThemedText style={[styles.sizeValue, { color: colors.foreground }]}>
                  {PANTS_SIZE_LABELS[user.ppeSize.shorts]}
                </ThemedText>
              </View>
            )}

            {/* Boots */}
            {user.ppeSize?.boots && (
              <View style={styles.sizeItem}>
                <View style={styles.sizeItemHeader}>
                  <IconShoe size={18} color={colors.mutedForeground} />
                  <ThemedText style={[styles.sizeLabel, { color: colors.mutedForeground }]}>
                    Botas
                  </ThemedText>
                </View>
                <ThemedText style={[styles.sizeValue, { color: colors.foreground }]}>
                  {BOOT_SIZE_LABELS[user.ppeSize.boots]}
                </ThemedText>
              </View>
            )}

            {/* Rain Boots */}
            {user.ppeSize?.rainBoots && (
              <View style={styles.sizeItem}>
                <View style={styles.sizeItemHeader}>
                  <IconUmbrella size={18} color={colors.mutedForeground} />
                  <ThemedText style={[styles.sizeLabel, { color: colors.mutedForeground }]}>
                    Galocha
                  </ThemedText>
                </View>
                <ThemedText style={[styles.sizeValue, { color: colors.foreground }]}>
                  {RAIN_BOOTS_SIZE_LABELS[user.ppeSize.rainBoots]}
                </ThemedText>
              </View>
            )}

            {/* Sleeves */}
            {user.ppeSize?.sleeves && (
              <View style={styles.sizeItem}>
                <View style={styles.sizeItemHeader}>
                  <IconHanger size={18} color={colors.mutedForeground} />
                  <ThemedText style={[styles.sizeLabel, { color: colors.mutedForeground }]}>
                    Manguito
                  </ThemedText>
                </View>
                <ThemedText style={[styles.sizeValue, { color: colors.foreground }]}>
                  {SLEEVES_SIZE_LABELS[user.ppeSize.sleeves]}
                </ThemedText>
              </View>
            )}

            {/* Mask */}
            {user.ppeSize?.mask && (
              <View style={styles.sizeItem}>
                <View style={styles.sizeItemHeader}>
                  <IconMask size={18} color={colors.mutedForeground} />
                  <ThemedText style={[styles.sizeLabel, { color: colors.mutedForeground }]}>
                    Máscara
                  </ThemedText>
                </View>
                <ThemedText style={[styles.sizeValue, { color: colors.foreground }]}>
                  {MASK_SIZE_LABELS[user.ppeSize.mask]}
                </ThemedText>
              </View>
            )}

            {/* Gloves */}
            {user.ppeSize?.gloves && (
              <View style={styles.sizeItem}>
                <View style={styles.sizeItemHeader}>
                  <IconHandGrab size={18} color={colors.mutedForeground} />
                  <ThemedText style={[styles.sizeLabel, { color: colors.mutedForeground }]}>
                    Luvas
                  </ThemedText>
                </View>
                <ThemedText style={[styles.sizeValue, { color: colors.foreground }]}>
                  {GLOVES_SIZE_LABELS[user.ppeSize.gloves]}
                </ThemedText>
              </View>
            )}
          </View>
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
    gap: spacing.sm,
  },
  sizesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  sizeItem: {
    flex: 1,
    minWidth: "45%",
    gap: spacing.xs,
  },
  sizeItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  sizeLabel: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  sizeValue: {
    fontSize: fontSize.base,
    fontWeight: "600",
    paddingLeft: spacing.xs + 18, // Align with icon
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
