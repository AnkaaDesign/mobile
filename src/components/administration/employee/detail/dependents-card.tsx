// Dependentes (IRRF / Salário-Família) — mirrors web DependentsCard.
// Self-hides when the collaborator has no dependents.

import { View, StyleSheet } from "react-native";

import type { Dependent } from "@/types";
import { DEPENDENT_RELATIONSHIP_LABELS } from "@/constants";
import { formatDate } from "@/utils";
import { useDependents } from "@/hooks/useDependent";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

interface DependentsCardProps {
  userId: string;
}

export function DependentsCard({ userId }: DependentsCardProps) {
  const { colors } = useTheme();

  const { data, isLoading } = useDependents(
    {
      userIds: [userId],
      orderBy: { name: "asc" },
      limit: 100,
    } as any,
    { enabled: !!userId },
  );

  const dependents: Dependent[] = data?.data ?? [];

  if (isLoading || dependents.length === 0) return null;

  return (
    <DetailCard title="Dependentes" icon="users">
      <View style={styles.list}>
        {dependents.map((dependent) => (
          <View key={dependent.id} style={[styles.row, { borderColor: colors.border }]}>
            <View style={styles.headerRow}>
              <ThemedText style={[styles.name, { color: colors.foreground }]}>{dependent.name}</ThemedText>
              <Badge variant="outline" size="sm">
                {DEPENDENT_RELATIONSHIP_LABELS[dependent.relationship] ?? dependent.relationship}
              </Badge>
            </View>
            <ThemedText style={[styles.meta, { color: colors.mutedForeground }]}>
              Nascimento: {formatDate(dependent.birthDate)}
            </ThemedText>
            <View style={styles.badgeRow}>
              {dependent.irrfDeduction && (
                <Badge variant="blue" size="sm">
                  IRRF
                </Badge>
              )}
              {dependent.salarioFamilia && (
                <Badge variant="teal" size="sm">
                  Salário-Família
                </Badge>
              )}
            </View>
          </View>
        ))}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: { borderWidth: 1, borderRadius: 8, padding: spacing.md, gap: spacing.xs },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  name: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, flex: 1 },
  meta: { fontSize: fontSize.sm },
  badgeRow: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
});
