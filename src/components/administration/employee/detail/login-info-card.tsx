
import { View, StyleSheet } from "react-native";
import type { User } from '../../../../types';
import { formatDateTime, formatRelativeTime } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";

interface LoginInfoCardProps {
  employee: User;
}

export function LoginInfoCard({ employee }: LoginInfoCardProps) {
  const { colors } = useTheme();

  return (
    <DetailCard title="Informações de Login" icon="log-in">
      {/* Verification Status */}
      <DetailField
        label="Status de Verificação"
        icon="shield-check"
        value={
          <Badge variant={employee.verified ? "success" : "destructive"}>
            {employee.verified ? "Verificado" : "Não Verificado"}
          </Badge>
        }
      />

      {/* Password Change Required */}
      <DetailField
        label="Alteração de Senha"
        icon="key"
        value={
          <Badge variant={employee.requirePasswordChange ? "warning" : "outline"}>
            {employee.requirePasswordChange ? "Obrigatória" : "Não Obrigatória"}
          </Badge>
        }
      />

      {/* Last Login */}
      <DetailField
        label="Último Acesso"
        icon="clock"
        value={
          employee.lastLoginAt ? (
            <View style={styles.dateContainer}>
              <ThemedText style={[styles.dateValue, { color: colors.foreground }]}>
                {formatDateTime(employee.lastLoginAt)}
              </ThemedText>
              <ThemedText style={[styles.relativeTime, { color: colors.mutedForeground }]}>
                ({formatRelativeTime(employee.lastLoginAt)})
              </ThemedText>
            </View>
          ) : (
            "Nunca acessou"
          )
        }
      />

      {/* Verification Details - Optional Section */}
      {(employee.verificationType || employee.verificationExpiresAt) && (
        <DetailSection title="Detalhes da Verificação">
          {employee.verificationType && (
            <DetailField
              label="Tipo de Verificação"
              icon="shield-check"
              value={employee.verificationType}
            />
          )}

          {employee.verificationExpiresAt && (
            <DetailField
              label="Expiração da Verificação"
              icon="clock"
              value={formatDateTime(employee.verificationExpiresAt)}
            />
          )}
        </DetailSection>
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  dateContainer: {
    gap: spacing.xs / 2,
  },
  dateValue: {
    fontSize: fontSize.sm,
  },
  relativeTime: {
    fontSize: fontSize.xs,
    fontStyle: "italic",
  },
});
