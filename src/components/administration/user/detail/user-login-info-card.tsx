import { View, StyleSheet } from "react-native";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import type { User } from '../../../../types';
import { formatDateTime, formatRelativeTime } from "@/utils";
import { VERIFICATION_TYPE, VERIFICATION_TYPE_LABELS } from "@/constants";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";

interface UserLoginInfoCardProps {
  user: User;
}

export function UserLoginInfoCard({ user }: UserLoginInfoCardProps) {
  const { colors } = useTheme();

  return (
    <DetailCard title="Informações de Login" icon="login">
      {/* Access Data Section */}
      <DetailSection title="Dados de Acesso">
        {/* Verification Status */}
        <DetailField
          label="Status de Verificação"
          value={
            <Badge variant={user.verified ? "success" : "secondary"} style={styles.badge}>
              {user.verified ? "Verificado" : "Não Verificado"}
            </Badge>
          }
          icon={user.verified ? "shield-check" : "shield-off"}
          iconColor={user.verified ? colors.success : colors.mutedForeground}
        />

        {/* Password Change Requirement */}
        {user.requirePasswordChange !== undefined && (
          <DetailField
            label="Alteração de Senha"
            value={
              <Badge variant={user.requirePasswordChange ? "warning" : "success"} style={styles.badge}>
                {user.requirePasswordChange ? "Requerida" : "Não Requerida"}
              </Badge>
            }
            icon="key"
          />
        )}

        {/* Last Login */}
        {user.lastLoginAt && (
          <DetailField
            label="Último Acesso"
            value={
              <View>
                <ThemedText style={[styles.valueText, { color: colors.foreground }]}>
                  {formatDateTime(user.lastLoginAt)}
                </ThemedText>
                <ThemedText style={[styles.subtextValue, { color: colors.mutedForeground }]}>
                  {formatRelativeTime(user.lastLoginAt)}
                </ThemedText>
              </View>
            }
            icon="clock"
          />
        )}
      </DetailSection>

      {/* Verification Details Section */}
      {user.verificationType && (
        <>
          <View style={[styles.divider, { borderTopColor: colors.border }]} />
          <DetailSection title="Detalhes da Verificação">
            <DetailField
              label="Tipo de Verificação"
              value={VERIFICATION_TYPE_LABELS[user.verificationType as VERIFICATION_TYPE]}
              icon="shield"
            />

            {user.verificationExpiresAt && (
              <DetailField
                label="Expiração da Verificação"
                value={formatDateTime(user.verificationExpiresAt)}
                icon="calendar"
              />
            )}
          </DetailSection>
        </>
      )}

      {/* System Information Section */}
      <View style={[styles.divider, { borderTopColor: colors.border }]} />
      <DetailSection title="Informações do Sistema">
        {user.createdAt && (
          <DetailField
            label="Data de Criação"
            value={
              <View>
                <ThemedText style={[styles.valueText, { color: colors.foreground }]}>
                  {formatDateTime(user.createdAt)}
                </ThemedText>
                <ThemedText style={[styles.subtextValue, { color: colors.mutedForeground }]}>
                  {formatRelativeTime(user.createdAt)}
                </ThemedText>
              </View>
            }
            icon="clock"
          />
        )}

        {user.updatedAt && (
          <DetailField
            label="Última Atualização"
            value={
              <View>
                <ThemedText style={[styles.valueText, { color: colors.foreground }]}>
                  {formatDateTime(user.updatedAt)}
                </ThemedText>
                <ThemedText style={[styles.subtextValue, { color: colors.mutedForeground }]}>
                  {formatRelativeTime(user.updatedAt)}
                </ThemedText>
              </View>
            }
            icon="clock"
          />
        )}
      </DetailSection>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
  },
  divider: {
    borderTopWidth: 1,
    marginVertical: spacing.sm,
  },
  valueText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  subtextValue: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
