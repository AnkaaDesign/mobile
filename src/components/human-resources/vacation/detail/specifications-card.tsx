
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconCalendar, IconUser, IconTag, IconFlag, IconUsers } from "@tabler/icons-react-native";
import type { Vacation } from '@/types';
import { VACATION_STATUS_LABELS, VACATION_TYPE_LABELS } from '@/constants';
import { formatDate, formatDateTime } from '@/utils';
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

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
    <Card style={styles.card}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconTag size={20} color={colors.mutedForeground} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>Especificações</ThemedText>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Employee */}
        {vacation.user && (
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <IconUser size={14} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Colaborador</ThemedText>
            </View>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>{vacation.user.name}</ThemedText>
            {vacation.user.email && (
              <ThemedText style={[styles.subValue, { color: colors.mutedForeground }]}>
                {vacation.user.email}
              </ThemedText>
            )}
          </View>
        )}

        {/* Period */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <IconCalendar size={14} color={colors.mutedForeground} />
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Período</ThemedText>
          </View>
          <View style={styles.dateRow}>
            <ThemedText style={[styles.dateText, { color: colors.foreground }]}>
              {formatDate(vacation.startAt)}
            </ThemedText>
            <ThemedText style={[styles.dateArrow, { color: colors.mutedForeground }]}>→</ThemedText>
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

        {/* Type */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <IconTag size={14} color={colors.mutedForeground} />
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Tipo</ThemedText>
          </View>
          <Badge variant="outline">
            <ThemedText style={[styles.badgeText, { color: colors.foreground }]}>
              {VACATION_TYPE_LABELS[vacation.type]}
            </ThemedText>
          </Badge>
        </View>

        {/* Status */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <IconFlag size={14} color={colors.mutedForeground} />
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Status</ThemedText>
          </View>
          <Badge variant={getStatusBadgeVariant(vacation.status)}>
            <ThemedText style={[styles.badgeText, { color: colors.primaryForeground }]}>
              {VACATION_STATUS_LABELS[vacation.status]}
            </ThemedText>
          </Badge>
        </View>

        {/* Vacation Type (Collective/Individual) */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <IconUsers size={14} color={colors.mutedForeground} />
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Tipo de Férias</ThemedText>
          </View>
          <ThemedText style={[styles.value, { color: colors.foreground }]}>
            {vacation.isCollective ? "Férias Coletivas" : "Férias Individuais"}
          </ThemedText>
        </View>

        {/* Metadata */}
        <View style={[styles.metadata, { borderTopColor: colors.border }]}>
          <View style={styles.metadataRow}>
            <ThemedText style={[styles.metadataLabel, { color: colors.mutedForeground }]}>
              Criado em
            </ThemedText>
            <ThemedText style={[styles.metadataValue, { color: colors.foreground }]}>
              {formatDateTime(vacation.createdAt)}
            </ThemedText>
          </View>

          <View style={styles.metadataRow}>
            <ThemedText style={[styles.metadataLabel, { color: colors.mutedForeground }]}>
              Última atualização
            </ThemedText>
            <ThemedText style={[styles.metadataValue, { color: colors.foreground }]}>
              {formatDateTime(vacation.updatedAt)}
            </ThemedText>
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
  section: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
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
  metadata: {
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  metadataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metadataLabel: {
    fontSize: fontSize.sm,
  },
  metadataValue: {
    fontSize: fontSize.sm,
  },
});
