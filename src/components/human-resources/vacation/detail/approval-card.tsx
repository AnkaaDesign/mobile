import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconCircleCheck, IconCircleX, IconUser, IconCalendar, IconMessageCircle } from "@tabler/icons-react-native";
import type { Vacation } from '../../../../types';
import { VACATION_STATUS } from '../../../../constants';
import { formatDateTime, formatRelativeTime } from '../../../../utils';
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";

interface ApprovalCardProps {
  vacation: Vacation;
}

export function ApprovalCard({ vacation }: ApprovalCardProps) {
  const { colors } = useTheme();

  // Only show for approved or rejected vacations
  if (vacation.status !== VACATION_STATUS.APPROVED && vacation.status !== VACATION_STATUS.REJECTED) {
    return null;
  }

  const isApproved = vacation.status === VACATION_STATUS.APPROVED;
  const statusColor = isApproved ? extendedColors.green : extendedColors.red;
  const StatusIcon = isApproved ? IconCircleCheck : IconCircleX;

  // In a real implementation, these would come from the vacation object
  // For now, we'll use placeholder data from updatedAt
  const approvalDate = vacation.updatedAt;
  const approverName = "Sistema"; // Placeholder - would come from approver user relation

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: statusColor[100 as keyof typeof statusColor] }])}>
              <StatusIcon size={18} color={statusColor[600 as keyof typeof statusColor]} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
              {isApproved ? "Informações de Aprovação" : "Informações de Rejeição"}
            </ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.approvalContent}>
          {/* Status Badge */}
          <View style={styles.statusBadgeContainer}>
            <Badge
              variant={isApproved ? "success" : "destructive"}
              style={StyleSheet.flatten([styles.statusBadge, { backgroundColor: statusColor[500 as keyof typeof statusColor] }])}
            >
              <View style={styles.badgeContent}>
                <StatusIcon size={16} color="#FFFFFF" />
                <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: "#FFFFFF" }])}>
                  {isApproved ? "Férias Aprovadas" : "Férias Rejeitadas"}
                </ThemedText>
              </View>
            </Badge>
          </View>

          {/* Approval Details Card */}
          <View style={StyleSheet.flatten([styles.detailsCard, { backgroundColor: statusColor[50 as keyof typeof statusColor], borderColor: statusColor[200 as keyof typeof statusColor] }])}>
            {/* Date Information */}
            <View style={styles.detailItem}>
              <View style={styles.detailHeader}>
                <IconCalendar size={16} color={statusColor[600 as keyof typeof statusColor]} />
                <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: statusColor[700 as keyof typeof statusColor] }])}>
                  Data de {isApproved ? "Aprovação" : "Rejeição"}
                </ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: statusColor[800 as keyof typeof statusColor] }])}>
                {formatDateTime(approvalDate)}
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailRelative, { color: statusColor[600 as keyof typeof statusColor] }])}>
                {formatRelativeTime(approvalDate)}
              </ThemedText>
            </View>

            {/* Approver Information */}
            <View style={StyleSheet.flatten([styles.detailItem, { borderTopColor: statusColor[200 as keyof typeof statusColor], borderTopWidth: 1, paddingTop: spacing.md }])}>
              <View style={styles.detailHeader}>
                <IconUser size={16} color={statusColor[600 as keyof typeof statusColor]} />
                <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: statusColor[700 as keyof typeof statusColor] }])}>
                  {isApproved ? "Aprovado por" : "Rejeitado por"}
                </ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: statusColor[800 as keyof typeof statusColor] }])}>
                {approverName}
              </ThemedText>
            </View>
          </View>

          {/* Additional Information */}
          <View style={StyleSheet.flatten([styles.infoCard, { backgroundColor: colors.muted + "20" }])}>
            <View style={styles.infoHeader}>
              <IconMessageCircle size={16} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.infoTitle, { color: colors.foreground }])}>
                Observações
              </ThemedText>
            </View>
            <ThemedText style={StyleSheet.flatten([styles.infoText, { color: colors.mutedForeground }])}>
              {isApproved
                ? "As férias foram aprovadas e o funcionário será notificado. O período de férias está confirmado conforme as datas solicitadas."
                : "As férias foram rejeitadas. Entre em contato com o departamento de recursos humanos para mais informações sobre o motivo da rejeição."}
            </ThemedText>
          </View>

          {/* Next Steps */}
          {isApproved && vacation.status === VACATION_STATUS.APPROVED && (
            <View style={StyleSheet.flatten([styles.nextStepsCard, { backgroundColor: extendedColors.blue[50], borderColor: extendedColors.blue[200] }])}>
              <ThemedText style={StyleSheet.flatten([styles.nextStepsTitle, { color: extendedColors.blue[800] }])}>
                Próximos Passos
              </ThemedText>
              <View style={styles.stepsList}>
                <View style={styles.stepItem}>
                  <View style={StyleSheet.flatten([styles.stepBullet, { backgroundColor: extendedColors.blue[500] }])} />
                  <ThemedText style={StyleSheet.flatten([styles.stepText, { color: extendedColors.blue[700] }])}>
                    Aguardar o início das férias em {formatDateTime(vacation.startAt, "short")}
                  </ThemedText>
                </View>
                <View style={styles.stepItem}>
                  <View style={StyleSheet.flatten([styles.stepBullet, { backgroundColor: extendedColors.blue[500] }])} />
                  <ThemedText style={StyleSheet.flatten([styles.stepText, { color: extendedColors.blue[700] }])}>
                    O funcionário deve confirmar o recebimento da notificação
                  </ThemedText>
                </View>
              </View>
            </View>
          )}
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
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
  approvalContent: {
    gap: spacing.lg,
  },
  statusBadgeContainer: {
    alignItems: "center",
  },
  statusBadge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  badgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  detailsCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  detailItem: {
    gap: spacing.xs,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  detailValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  detailRelative: {
    fontSize: fontSize.xs,
  },
  infoCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  infoTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  infoText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
  nextStepsCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  nextStepsTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  stepsList: {
    gap: spacing.sm,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  stepBullet: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
    marginTop: 6,
  },
  stepText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
});
