import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import {
  IconUser,
  IconHome,
  IconBuildingCommunity,
  IconMap,
  IconMailbox,
  IconCake,
  IconHash
} from "@tabler/icons-react-native";
import type { User } from '../../../../types';
import { formatDate } from "@/utils";

interface UserAddressCardProps {
  user: User;
}

// Helper function to calculate age
function getAge(birthDate: Date | string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function UserAddressCard({ user }: UserAddressCardProps) {
  const { colors } = useTheme();

  const hasAddress = user.address || user.neighborhood || user.city || user.state || user.zipCode;
  const hasPersonalInfo = user.birth || user.payrollNumber;

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconUser size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações Pessoais</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Personal Information Section */}
        {hasPersonalInfo && (
          <>
            <ThemedText style={[styles.subsectionTitle, { color: colors.foreground }]}>
              Dados Pessoais
            </ThemedText>

            {user.birth && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <IconCake size={20} color={colors.mutedForeground} />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Data de Nascimento
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                    {formatDate(user.birth)} ({getAge(user.birth)} anos)
                  </ThemedText>
                </View>
              </View>
            )}

            {user.payrollNumber && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <IconHash size={20} color={colors.mutedForeground} />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Número da Folha
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.foreground, fontFamily: 'monospace' }]}>
                    {user.payrollNumber}
                  </ThemedText>
                </View>
              </View>
            )}
          </>
        )}

        {/* Address Section */}
        {hasAddress && (
          <>
            {hasPersonalInfo && <View style={[styles.divider, { borderTopColor: colors.border }]} />}
            <ThemedText style={[styles.subsectionTitle, { color: colors.foreground }]}>
              Endereço
            </ThemedText>

            {user.address && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <IconHome size={20} color={colors.mutedForeground} />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Endereço
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                    {user.address}
                    {user.addressNumber && `, ${user.addressNumber}`}
                  </ThemedText>
                  {user.addressComplement && (
                    <ThemedText style={[styles.detailSubtext, { color: colors.mutedForeground }]}>
                      {user.addressComplement}
                    </ThemedText>
                  )}
                </View>
              </View>
            )}

            {user.neighborhood && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <IconBuildingCommunity size={20} color={colors.mutedForeground} />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Bairro
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                    {user.neighborhood}
                  </ThemedText>
                </View>
              </View>
            )}

            {(user.city || user.state) && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <IconMap size={20} color={colors.mutedForeground} />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Cidade/Estado
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                    {user.city}
                    {user.city && user.state && " - "}
                    {user.state}
                  </ThemedText>
                </View>
              </View>
            )}

            {user.zipCode && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <IconMailbox size={20} color={colors.mutedForeground} />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    CEP
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.foreground, fontFamily: 'monospace' }]}>
                    {user.zipCode.replace(/(\d{5})(\d{3})/, "$1-$2")}
                  </ThemedText>
                </View>
              </View>
            )}
          </>
        )}

        {/* Empty State */}
        {!hasAddress && !hasPersonalInfo && (
          <View style={styles.emptyState}>
            <IconUser size={48} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
            <ThemedText style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
              Nenhuma informação pessoal cadastrada
            </ThemedText>
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
    gap: spacing.sm,
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
  divider: {
    borderTopWidth: 1,
    marginVertical: spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
    gap: spacing.md,
  },
  emptyStateText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
