import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconLogin, IconShieldCheck, IconShieldOff, IconKey, IconClock } from "@tabler/icons-react-native";
import type { User } from '../../../../types';
import { formatDateTime, formatRelativeTime } from "@/utils";
import { VERIFICATION_TYPE_LABELS } from "@/constants";

interface UserLoginInfoCardProps {
  user: User;
}

export function UserLoginInfoCard({ user }: UserLoginInfoCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconLogin size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações de Login</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Access Data Section */}
        <ThemedText style={[styles.subsectionTitle, { color: colors.foreground }]}>
          Dados de Acesso
        </ThemedText>

        {/* Verification Status */}
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            {user.verified ? (
              <IconShieldCheck size={20} color={colors.success} />
            ) : (
              <IconShieldOff size={20} color={colors.mutedForeground} />
            )}
          </View>
          <View style={styles.detailContent}>
            <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Status de Verificação
            </ThemedText>
            <Badge variant={user.verified ? "success" : "secondary"} style={styles.badge}>
              {user.verified ? "Verificado" : "Não Verificado"}
            </Badge>
          </View>
        </View>

        {/* Password Change Requirement */}
        {user.requirePasswordChange !== undefined && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <IconKey size={20} color={colors.mutedForeground} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Alteração de Senha
              </ThemedText>
              <Badge variant={user.requirePasswordChange ? "warning" : "success"} style={styles.badge}>
                {user.requirePasswordChange ? "Requerida" : "Não Requerida"}
              </Badge>
            </View>
          </View>
        )}

        {/* Last Login */}
        {user.lastLoginAt && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <IconClock size={20} color={colors.mutedForeground} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Último Acesso
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                {formatDateTime(user.lastLoginAt)}
              </ThemedText>
              <ThemedText style={[styles.detailSubtext, { color: colors.mutedForeground }]}>
                {formatRelativeTime(user.lastLoginAt)}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Verification Details Section */}
        {user.verificationType && (
          <>
            <View style={[styles.divider, { borderTopColor: colors.border }]} />
            <ThemedText style={[styles.subsectionTitle, { color: colors.foreground }]}>
              Detalhes da Verificação
            </ThemedText>

            <View style={styles.detailRow}>
              <View style={styles.detailContent}>
                <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  Tipo de Verificação
                </ThemedText>
                <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                  {VERIFICATION_TYPE_LABELS[user.verificationType]}
                </ThemedText>
              </View>
            </View>

            {user.verificationExpiresAt && (
              <View style={styles.detailRow}>
                <View style={styles.detailContent}>
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Expiração da Verificação
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                    {formatDateTime(user.verificationExpiresAt)}
                  </ThemedText>
                </View>
              </View>
            )}
          </>
        )}

        {/* System Information Section */}
        <View style={[styles.divider, { borderTopColor: colors.border }]} />
        <ThemedText style={[styles.subsectionTitle, { color: colors.foreground }]}>
          Informações do Sistema
        </ThemedText>

        {user.createdAt && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <IconClock size={20} color={colors.mutedForeground} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Data de Criação
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                {formatDateTime(user.createdAt)}
              </ThemedText>
              <ThemedText style={[styles.detailSubtext, { color: colors.mutedForeground }]}>
                {formatRelativeTime(user.createdAt)}
              </ThemedText>
            </View>
          </View>
        )}

        {user.updatedAt && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <IconClock size={20} color={colors.mutedForeground} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Última Atualização
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                {formatDateTime(user.updatedAt)}
              </ThemedText>
              <ThemedText style={[styles.detailSubtext, { color: colors.mutedForeground }]}>
                {formatRelativeTime(user.updatedAt)}
              </ThemedText>
            </View>
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
    gap: spacing.md,
  },
  subsectionTitle: {
    fontSize: fontSize.base,
    fontWeight: "500",
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
    fontWeight: "500",
  },
  detailValue: {
    fontSize: fontSize.sm,
  },
  detailSubtext: {
    fontSize: fontSize.xs,
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: spacing.xs / 2,
  },
  divider: {
    borderTopWidth: 1,
    marginVertical: spacing.sm,
  },
});
