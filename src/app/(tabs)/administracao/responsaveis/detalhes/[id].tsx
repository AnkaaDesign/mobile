import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useResponsible } from "@/hooks";
import { routes, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { DetailScreen } from "@/components/screens/detail-screen";
import { ResponsibleRole, RESPONSIBLE_ROLE_LABELS } from "@/types/responsible";
import type { BadgeVariant } from "@/constants/badge-colors";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard, DetailField, DetailPhoneField } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconUser, IconHistory } from "@tabler/icons-react-native";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

const ROLE_BADGE_VARIANTS: Record<ResponsibleRole, BadgeVariant> = {
  [ResponsibleRole.COMMERCIAL]: 'blue',
  [ResponsibleRole.OWNER]: 'destructive',
  [ResponsibleRole.SELLER]: 'cyan',
  [ResponsibleRole.REPRESENTATIVE]: 'secondary',
  [ResponsibleRole.MARKETING]: 'purple',
  [ResponsibleRole.COORDINATOR]: 'green',
  [ResponsibleRole.FINANCIAL]: 'orange',
  [ResponsibleRole.FLEET_MANAGER]: 'gray',
  [ResponsibleRole.DRIVER]: 'outline',
};

export default function ResponsibleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const query = useResponsible(id as string, {
    select: {
      id: true,
      name: true,
      role: true,
      phone: true,
      email: true,
      isActive: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
      company: { select: { id: true, fantasyName: true } },
    },
    enabled: !!id,
  });

  return (
    <DetailScreen<any>
      query={query as any}
      icon={IconUser}
      title={(r) => r.name ?? "Responsável"}
      editRoute={(r) => mobileRoute(routes.administration.responsibles.edit(r.id))}
      notFoundFallback={mobileRoute(routes.administration.responsibles.list)}
    >
      {(rep) => (
        <View style={styles.body}>
          <DetailCard title="Informações Básicas" icon="user">
            <DetailField label="Nome" value={rep.name} icon="user" />
            <DetailField
              label="Função"
              value={
                <Badge
                  variant={ROLE_BADGE_VARIANTS[rep.role as ResponsibleRole] || "default"}
                  size="sm"
                  style={{ alignSelf: "flex-start" }}
                >
                  {RESPONSIBLE_ROLE_LABELS[rep.role as ResponsibleRole]}
                </Badge>
              }
              icon="briefcase"
            />
            <DetailField
              label="Status"
              value={
                <Badge variant={rep.isActive ? "default" : "secondary"} size="sm">
                  <ThemedText style={{ fontSize: 11 }}>
                    {rep.isActive ? "Ativo" : "Inativo"}
                  </ThemedText>
                </Badge>
              }
              icon="circle-check"
            />
            <DetailField label="Empresa" value={rep.company?.fantasyName || "-"} icon="building" />
          </DetailCard>

          <DetailCard title="Contato" icon="phone">
            {rep.phone && <DetailPhoneField label="Telefone" phone={rep.phone} icon="phone" />}
            <DetailField label="E-mail" value={rep.email || "-"} icon="mail" />
            <DetailField
              label="Acesso ao Sistema"
              value={
                <Badge variant={rep.email ? "default" : "secondary"} size="sm">
                  <ThemedText style={{ fontSize: 11 }}>
                    {rep.email ? "Habilitado" : "Desabilitado"}
                  </ThemedText>
                </Badge>
              }
              icon="lock"
            />
          </DetailCard>

          <Card style={styles.card}>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
              <IconHistory size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.sectionTitle}>Histórico de Alterações</ThemedText>
            </View>
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.REPRESENTATIVE}
              entityId={rep.id}
              entityName={rep.name}
              entityCreatedAt={rep.createdAt}
              maxHeight={400}
            />
          </Card>
        </View>
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
  },
  card: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
});
