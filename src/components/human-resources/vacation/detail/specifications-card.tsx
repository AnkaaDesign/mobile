
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import type { Vacation } from '@/types';
import { VACATION_STATUS_LABELS, VACATION_TYPE_LABELS } from '@/constants';
import { formatDate, formatDateTime } from '@/utils';
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";

interface SpecificationsCardProps {
  vacation: Vacation & { user?: { name: string; email: string | null } };
}

export function SpecificationsCard({ vacation }: SpecificationsCardProps) {
  const { colors } = useTheme();

  const start = new Date(vacation.startAt);
  const end = new Date(vacation.endAt);
  const today = new Date();
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const getStatusBadgeVariant = (status: string): "default" | "success" | "destructive" | "secondary" | "warning" | "outline" | "info" => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "destructive";
      case "CANCELLED":
        return "secondary";
      case "IN_PROGRESS":
        return "default";
      case "COMPLETED":
        return "outline";
      default:
        return "warning";
    }
  };

  const getTimeStatus = () => {
    if (today < start) {
      const daysUntil = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { text: `Inicia em ${daysUntil} dias`, variant: "secondary" as const };
    } else if (today > end) {
      const daysAgo = Math.ceil((today.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
      return { text: `Finalizada há ${daysAgo} dias`, variant: "outline" as const };
    } else {
      const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { text: `${daysRemaining} dias restantes`, variant: "default" as const };
    }
  };

  const timeStatus = getTimeStatus();

  return (
    <DetailCard title="Especificações" icon="tag">
      {/* Employee */}
      {vacation.user && (
        <DetailField
          label="Colaborador"
          icon="user"
          value={
            <View>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>{vacation.user.name}</ThemedText>
              {vacation.user.email && (
                <ThemedText style={[styles.subValue, { color: colors.mutedForeground }]}>
                  {vacation.user.email}
                </ThemedText>
              )}
            </View>
          }
        />
      )}

      {/* Period */}
      <DetailField
        label="Período"
        icon="calendar"
        value={
          <View>
            <View style={styles.dateRow}>
              <ThemedText style={[styles.dateText, { color: colors.foreground }]}>
                {formatDate(vacation.startAt)}
              </ThemedText>
              <ThemedText style={[styles.dateArrow, { color: colors.mutedForeground }]}>{" -> "}</ThemedText>
              <ThemedText style={[styles.dateText, { color: colors.foreground }]}>
                {formatDate(vacation.endAt)}
              </ThemedText>
            </View>
            <View style={styles.badgeRow}>
              <Badge variant="outline">
                <ThemedText style={[styles.badgeText, { color: colors.foreground }]}>
                  {totalDays} {totalDays === 1 ? "dia" : "dias"}
                </ThemedText>
              </Badge>
              <Badge variant={timeStatus.variant}>
                <ThemedText style={[styles.badgeText, { color: colors.primaryForeground }]}>
                  {timeStatus.text}
                </ThemedText>
              </Badge>
            </View>
          </View>
        }
      />

      {/* Type */}
      <DetailField
        label="Tipo"
        icon="tag"
        value={
          <Badge variant="outline">
            <ThemedText style={[styles.badgeText, { color: colors.foreground }]}>
              {VACATION_TYPE_LABELS[vacation.type]}
            </ThemedText>
          </Badge>
        }
      />

      {/* Status */}
      <DetailField
        label="Status"
        icon="flag"
        value={
          <Badge variant={getStatusBadgeVariant(vacation.status)}>
            <ThemedText style={[styles.badgeText, { color: colors.primaryForeground }]}>
              {VACATION_STATUS_LABELS[vacation.status]}
            </ThemedText>
          </Badge>
        }
      />

      {/* Vacation Type */}
      <DetailField
        label="Tipo de Férias"
        icon="users"
        value={vacation.isCollective ? "Férias Coletivas" : "Férias Individuais"}
      />

      {/* Metadata */}
      <DetailSection title="Datas do Sistema">
        <DetailField
          label="Criado em"
          icon="calendar"
          value={formatDateTime(vacation.createdAt)}
        />
        <DetailField
          label="Última atualização"
          icon="clock"
          value={formatDateTime(vacation.updatedAt)}
        />
      </DetailSection>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  value: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  subValue: {
    fontSize: fontSize.sm,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dateText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  dateArrow: {
    fontSize: fontSize.sm,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  badgeText: {
    fontSize: fontSize.xs,
  },
});
