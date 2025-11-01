
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { IconInfoCircle, IconCalendar } from "@tabler/icons-react-native";
import type { Position } from '../../../../types';
import { formatDateTime, formatCurrency } from '../../../../utils';
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

interface SpecificationsCardProps {
  position: Position;
}

export function SpecificationsCard({ position }: SpecificationsCardProps) {
  const { colors } = useTheme();

  // Use the virtual remuneration field (populated by backend)
  const currentRemuneration = position.remuneration ?? 0;

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconInfoCircle size={20} color={colors.primary} />
        <ThemedText style={[styles.title, { color: colors.foreground }]}>
          Especificações
        </ThemedText>
      </View>

      <View style={styles.content}>
        {/* Basic Information */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            Informações Básicas
          </ThemedText>

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Nome
              </ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {position.name}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Hierarquia
              </ThemedText>
              {position.hierarchy !== null && position.hierarchy !== undefined ? (
                <ThemedText style={[styles.value, { color: colors.foreground }]}>
                  {position.hierarchy}
                </ThemedText>
              ) : (
                <ThemedText style={[styles.emptyValue, { color: colors.mutedForeground }]}>
                  -
                </ThemedText>
              )}
            </View>

            <View style={styles.infoRow}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Remuneração Atual
              </ThemedText>
              {currentRemuneration ? (
                <ThemedText style={[styles.value, { color: colors.foreground }]}>
                  {formatCurrency(currentRemuneration)}
                </ThemedText>
              ) : (
                <ThemedText style={[styles.emptyValue, { color: colors.mutedForeground }]}>
                  -
                </ThemedText>
              )}
            </View>

            <View style={styles.infoRow}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Funcionários
              </ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {position._count?.users || 0} funcionário{(position._count?.users || 0) !== 1 ? 's' : ''}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Histórico de Remunerações
              </ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {position._count?.remunerations || 0} registro{(position._count?.remunerations || 0) !== 1 ? 's' : ''}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* System Dates */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <IconCalendar size={16} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              Datas do Sistema
            </ThemedText>
          </View>

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Criado em
              </ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {position.createdAt ? formatDateTime(position.createdAt) : '-'}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Atualizado em
              </ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {position.updatedAt ? formatDateTime(position.updatedAt) : '-'}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoList: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: "right",
  },
  emptyValue: {
    fontSize: fontSize.sm,
    textAlign: "right",
  },
});
