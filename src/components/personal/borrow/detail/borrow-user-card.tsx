import { View, StyleSheet, TouchableOpacity, Linking, Alert } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard, DetailField, DetailPhoneField, DetailSection } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconUser, IconExternalLink } from "@tabler/icons-react-native";
import type { Borrow } from "@/types";
import { formatBrazilianPhone } from "@/utils";
import { router } from "expo-router";
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';

interface BorrowUserCardProps {
  borrow: Borrow;
}

export function BorrowUserCard({ borrow }: BorrowUserCardProps) {
  const { colors } = useTheme();

  const handleNavigateToUser = () => {
    if (borrow.user?.id) {
      router.push(routeToMobilePath(routes.administration.users.details(borrow.user.id)) as any);
    }
  };

  if (!borrow.user) {
    return (
      <DetailCard title="Informações do Usuário" icon="user">
        <View style={styles.emptyState}>
          <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted + "30" }])}>
            <IconUser size={32} color={colors.mutedForeground} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.emptyTitle, { color: colors.foreground }])}>
            Usuário não encontrado
          </ThemedText>
          <ThemedText style={StyleSheet.flatten([styles.emptyDescription, { color: colors.mutedForeground }])}>
            As informações do usuário não estão disponíveis.
          </ThemedText>
        </View>
      </DetailCard>
    );
  }

  return (
    <DetailCard title="Informações do Usuário" icon="user">
      <View style={styles.content}>
        {/* User Name with Link */}
        <TouchableOpacity
          onPress={handleNavigateToUser}
          style={StyleSheet.flatten([styles.userNameContainer, { backgroundColor: colors.muted + "30" }])}
          activeOpacity={0.7}
        >
          <View style={styles.userNameContent}>
            <IconUser size={16} color={colors.mutedForeground} />
            <View style={styles.userTextContainer}>
              <ThemedText style={StyleSheet.flatten([styles.userLabel, { color: colors.mutedForeground }])}>
                Nome
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.userName, { color: colors.foreground }])}>
                {borrow.user.name}
              </ThemedText>
            </View>
          </View>
          <IconExternalLink size={16} color={colors.primary} />
        </TouchableOpacity>

        {/* Contact Information */}
        {borrow.user.email && (
          <DetailField label="E-mail" value={borrow.user.email} icon="mail" />
        )}

        {borrow.user.phone && (
          <DetailPhoneField
            label="Telefone"
            phone={borrow.user.phone}
          />
        )}

        {/* User Details */}
        {borrow.user.position?.name && (
          <DetailField label="Cargo" value={borrow.user.position.name} icon="briefcase" />
        )}

        {borrow.user.sector?.name && (
          <DetailField label="Setor" value={borrow.user.sector.name} />
        )}

        {borrow.user.cpf && (
          <DetailField label="CPF" value={borrow.user.cpf} monospace />
        )}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  userNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  userNameContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    flex: 1,
  },
  userTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  userLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  userName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
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
    fontWeight: fontWeight.semibold,
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});
