
import { View, StyleSheet} from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { IconInfoCircle, IconAlertTriangle, IconClipboardList, IconUsers, IconPackage } from "@tabler/icons-react-native";
import type { ItemCategory } from '../../../../../types';
import { ITEM_CATEGORY_TYPE } from "@/constants";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";

interface PpeInfoCardProps {
  category: ItemCategory;
  itemCount?: number;
}

export function PpeInfoCard({ category, itemCount = 0 }: PpeInfoCardProps) {
  const { colors } = useTheme();

  // Only show if category is PPE
  if (category.type !== ITEM_CATEGORY_TYPE.PPE) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Informações de Categoria EPI</ThemedText>
      </View>
      <View style={styles.content}>
        <View style={styles.innerContent}>
          {/* PPE Category Information */}
          <View>
            <ThemedText style={StyleSheet.flatten([styles.subSectionHeader, { color: colors.foreground }])}>Detalhes da Categoria</ThemedText>
            <View style={styles.sectionContent}>
              <View style={StyleSheet.flatten([styles.infoRow, { backgroundColor: colors.muted + "50" }])}>
                <View style={styles.labelContainer}>
                  <IconInfoCircle size={16} color={colors.mutedForeground} />
                  <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Status</ThemedText>
                </View>
                <Badge variant="default" style={{ backgroundColor: colors.primary + "20" }}>
                  <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.primary }])}>Categoria de EPI Ativa</ThemedText>
                </Badge>
              </View>

              <View style={StyleSheet.flatten([styles.infoRow, { backgroundColor: colors.muted + "50" }])}>
                <View style={styles.labelContainer}>
                  <IconPackage size={16} color={colors.mutedForeground} />
                  <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Total de Produtos</ThemedText>
                </View>
                <ThemedText
                  style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {itemCount} {itemCount === 1 ? "produto" : "produtos"}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* PPE Guidelines */}
          <View style={StyleSheet.flatten([styles.divider, { borderTopColor: colors.border + "50" }])} />
          <View>
            <ThemedText style={StyleSheet.flatten([styles.subSectionHeader, { color: colors.foreground }])}>Diretrizes de EPI</ThemedText>
            <View style={styles.guidelinesContainer}>
              <View style={StyleSheet.flatten([styles.guidelineCard, { backgroundColor: colors.warning + "10", borderColor: colors.warning + "30" }])}>
                <IconAlertTriangle size={20} color={colors.warning} />
                <View style={styles.guidelineContent}>
                  <ThemedText style={StyleSheet.flatten([styles.guidelineTitle, { color: colors.foreground }])}>Uso Obrigatório</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.guidelineText, { color: colors.mutedForeground }])}>
                    Produtos desta categoria são equipamentos de proteção individual obrigatórios
                  </ThemedText>
                </View>
              </View>

              <View style={StyleSheet.flatten([styles.guidelineCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }])}>
                <IconClipboardList size={20} color={colors.primary} />
                <View style={styles.guidelineContent}>
                  <ThemedText style={StyleSheet.flatten([styles.guidelineTitle, { color: colors.foreground }])}>Certificação CA</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.guidelineText, { color: colors.mutedForeground }])}>Todos os produtos devem possuir Certificado de Aprovação válido</ThemedText>
                </View>
              </View>

              <View style={StyleSheet.flatten([styles.guidelineCard, { backgroundColor: colors.secondary + "10", borderColor: colors.secondary + "30" }])}>
                <IconUsers size={20} color={colors.secondary} />
                <View style={styles.guidelineContent}>
                  <ThemedText style={StyleSheet.flatten([styles.guidelineTitle, { color: colors.foreground }])}>Atribuição Pessoal</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.guidelineText, { color: colors.mutedForeground }])}>EPIs podem ser atribuídos individualmente aos funcionários</ThemedText>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    gap: spacing.md,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexShrink: 0,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: "right",
  },
  divider: {
    paddingTop: spacing.lg,
    marginTop: spacing.lg,
    borderTopWidth: 1,
  },
  guidelinesContainer: {
    gap: spacing.md,
  },
  guidelineCard: {
    flexDirection: "row",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  guidelineContent: {
    flex: 1,
    gap: spacing.xs,
  },
  guidelineTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  guidelineText: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.4,
  },
});
