
import { View, StyleSheet } from "react-native";
import type { User } from '../../../../types';
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconShield } from "@tabler/icons-react-native";

interface PpeSizesCardProps {
  employee: User;
}

const PPE_SIZE_LABELS: Record<string, string> = {
  shirts: "Camisa",
  boots: "Botas",
  pants: "Calça",
  sleeves: "Manguito",
  mask: "Máscara",
  gloves: "Luvas",
  rainBoots: "Galocha",
};

export function PpeSizesCard({ employee }: PpeSizesCardProps) {
  const { colors } = useTheme();

  // If no PPE size data, show empty state
  if (!employee.ppeSize) {
    return (
      <Card style={styles.card}>
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.titleRow}>
            <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
              <IconShield size={18} color={colors.primary} />
            </View>
            <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
              Tamanhos de EPI
            </ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <ThemedText style={[styles.emptyState, { color: colors.mutedForeground }]}>
            Nenhum tamanho de EPI configurado
          </ThemedText>
        </View>
      </Card>
    );
  }

  const { ppeSize } = employee;

  // Create list of available PPE sizes
  const ppeSizes = [
    { key: 'shirts', label: PPE_SIZE_LABELS.shirts, value: ppeSize.shirts },
    { key: 'pants', label: PPE_SIZE_LABELS.pants, value: ppeSize.pants },
    { key: 'boots', label: PPE_SIZE_LABELS.boots, value: ppeSize.boots },
    { key: 'rainBoots', label: PPE_SIZE_LABELS.rainBoots, value: ppeSize.rainBoots },
    { key: 'sleeves', label: PPE_SIZE_LABELS.sleeves, value: ppeSize.sleeves },
    { key: 'mask', label: PPE_SIZE_LABELS.mask, value: ppeSize.mask },
    { key: 'gloves', label: PPE_SIZE_LABELS.gloves, value: ppeSize.gloves },
  ].filter(item => item.value !== null);

  // If no sizes configured at all
  if (ppeSizes.length === 0) {
    return (
      <Card style={styles.card}>
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.titleRow}>
            <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
              <IconShield size={18} color={colors.primary} />
            </View>
            <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
              Tamanhos de EPI
            </ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <ThemedText style={[styles.emptyState, { color: colors.mutedForeground }]}>
            Nenhum tamanho de EPI configurado
          </ThemedText>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
            <IconShield size={18} color={colors.primary} />
          </View>
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
            Tamanhos de EPI
          </ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.grid}>
          {ppeSizes.map((item, _index) => (
            <View
              key={item.key}
              style={[
                styles.gridItem,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.muted + "20",
                }
              ]}
            >
              <ThemedText style={[styles.sizeLabel, { color: colors.mutedForeground }]}>
                {item.label}
              </ThemedText>
              <ThemedText style={[styles.sizeValue, { color: colors.foreground }]}>
                {item.value}
              </ThemedText>
            </View>
          ))}
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
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  content: {
    gap: spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  gridItem: {
    flex: 1,
    minWidth: "45%",
    maxWidth: "48%",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  sizeLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  sizeValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  emptyState: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
});
