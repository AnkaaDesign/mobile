
import { View, StyleSheet } from "react-native";
import type { User } from '../../../../types';
import { formatDateTime, formatRelativeTime } from '../../../../utils';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconLogin, IconShieldCheck, IconKey, IconClock } from "@tabler/icons-react-native";

interface LoginInfoCardProps {
  employee: User;
}

export function LoginInfoCard({ employee }: LoginInfoCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
            <IconLogin size={18} color={colors.primary} />
          </View>
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
            Informações de Login
          </ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Verification Status */}
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <IconShieldCheck size={20} color={colors.mutedForeground} />
          </View>
          <View style={styles.detailContent}>
            <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Status de Verificação
            </ThemedText>
            <Badge variant={employee.verified ? "success" : "destructive"} style={styles.badge}>
              {employee.verified ? "Verificado" : "Não Verificado"}
            </Badge>
          </View>
        </View>

        {/* Password Change Required */}
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <IconKey size={20} color={colors.mutedForeground} />
          </View>
          <View style={styles.detailContent}>
            <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Alteração de Senha
            </ThemedText>
            <Badge variant={employee.requirePasswordChange ? "warning" : "outline"} style={styles.badge}>
              {employee.requirePasswordChange ? "Obrigatória" : "Não Obrigatória"}
            </Badge>
          </View>
        </View>

        {/* Last Login */}
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <IconClock size={20} color={colors.mutedForeground} />
          </View>
          <View style={styles.detailContent}>
            <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Último Acesso
            </ThemedText>
            {employee.lastLoginAt ? (
              <View style={styles.dateContainer}>
                <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                  {formatDateTime(employee.lastLoginAt)}
                </ThemedText>
                <ThemedText style={[styles.relativeTime, { color: colors.mutedForeground }]}>
                  ({formatRelativeTime(employee.lastLoginAt)})
                </ThemedText>
              </View>
            ) : (
              <ThemedText style={[styles.detailValue, { color: colors.mutedForeground }]}>
                Nunca acessou
              </ThemedText>
            )}
          </View>
        </View>

        {/* Verification Details - Optional Section */}
        {(employee.verificationType || employee.verificationExpiresAt) && (
          <>
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <ThemedText style={[styles.subsectionTitle, { color: colors.foreground }]}>
              Detalhes da Verificação
            </ThemedText>

            {employee.verificationType && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <IconShieldCheck size={20} color={colors.mutedForeground} />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Tipo de Verificação
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                    {employee.verificationType}
                  </ThemedText>
                </View>
              </View>
            )}

            {employee.verificationExpiresAt && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <IconClock size={20} color={colors.mutedForeground} />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Expiração da Verificação
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                    {formatDateTime(employee.verificationExpiresAt)}
                  </ThemedText>
                </View>
              </View>
            )}
          </>
        )}
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
    borderBottomWidth: 1,
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
  detailRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  detailIcon: {
    paddingTop: 2,
  },
  detailContent: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  detailValue: {
    fontSize: fontSize.sm,
  },
  badge: {
    alignSelf: "flex-start",
  },
  dateContainer: {
    gap: spacing.xs / 2,
  },
  relativeTime: {
    fontSize: fontSize.xs,
    fontStyle: "italic",
  },
  separator: {
    height: 1,
    marginVertical: spacing.xs,
  },
  subsectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
});
