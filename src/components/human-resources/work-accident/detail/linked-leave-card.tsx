import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconCalendarOff } from "@tabler/icons-react-native";
import type { WorkAccidentReport } from "@/types";
import { LEAVE_TYPE_LABELS, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { useNav } from "@/contexts/nav";
import { formatDate } from "@/utils";

interface WorkAccidentLinkedLeaveCardProps {
  report: WorkAccidentReport;
}

export function WorkAccidentLinkedLeaveCard({ report }: WorkAccidentLinkedLeaveCardProps) {
  const { colors } = useTheme();
  const nav = useNav();

  const leave = report.leave as any;

  if (!leave) {
    return (
      <DetailCard title="Afastamento Vinculado" icon="calendar-off">
        <View style={styles.emptyState}>
          <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted + "30" }])}>
            <IconCalendarOff size={32} color={colors.mutedForeground} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.emptyTitle, { color: colors.foreground }])}>
            Nenhum afastamento vinculado
          </ThemedText>
          <ThemedText style={StyleSheet.flatten([styles.emptyDescription, { color: colors.mutedForeground }])}>
            Esta CAT não possui afastamento por acidente vinculado.
          </ThemedText>
        </View>
      </DetailCard>
    );
  }

  return (
    <DetailCard title="Afastamento Vinculado" icon="calendar-off">
      <View style={styles.content}>
        <DetailSection title="Afastamento">
          <DetailField
            label="Tipo"
            value={
              <Badge variant="secondary">
                <ThemedText style={styles.badgeText}>
                  {LEAVE_TYPE_LABELS[leave.type as keyof typeof LEAVE_TYPE_LABELS] || leave.type}
                </ThemedText>
              </Badge>
            }
          />
          <DetailField
            label="Início"
            value={leave.startDate ? formatDate(leave.startDate) : "-"}
            icon="calendar"
          />
          <DetailField
            label="Término Previsto"
            value={leave.expectedEndDate ? formatDate(leave.expectedEndDate) : "-"}
          />
          {leave.actualEndDate ? (
            <DetailField label="Retorno" value={formatDate(leave.actualEndDate)} />
          ) : null}
        </DetailSection>

        <ThemedText
          onPress={() =>
            nav.push(mobileRoute(routes.humanResources.occupationalHealth.leaves.details(leave.id)))
          }
          style={StyleSheet.flatten([styles.link, { color: colors.primary }])}
        >
          Ver detalhes do afastamento
        </ThemedText>
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  link: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});
