import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useRepresentative, useScreenReady } from "@/hooks";
import { routes, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { RepresentativeRole, REPRESENTATIVE_ROLE_LABELS } from "@/types/representative";
import type { BadgeVariant } from "@/constants/badge-colors";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard, DetailField, DetailPhoneField } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconUser, IconEdit, IconHistory } from "@tabler/icons-react-native";
import { routeToMobilePath } from '@/utils/route-mapper';
import { TouchableOpacity } from "react-native";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { Skeleton } from "@/components/ui/skeleton";

const ROLE_BADGE_VARIANTS: Record<RepresentativeRole, BadgeVariant> = {
  [RepresentativeRole.COMMERCIAL]: 'blue',
  [RepresentativeRole.MARKETING]: 'purple',
  [RepresentativeRole.COORDINATOR]: 'green',
  [RepresentativeRole.FINANCIAL]: 'orange',
  [RepresentativeRole.FLEET_MANAGER]: 'gray',
};

export default function RepresentativeDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: representative,
    isLoading,
    error,
    refetch,
  } = useRepresentative(id, {
    select: {
      id: true,
      name: true,
      role: true,
      phone: true,
      email: true,
      isActive: true,
      customerId: true,
      createdAt: true,
      updatedAt: true,
      customer: {
        select: {
          id: true,
          fantasyName: true,
        },
      },
    },
    enabled: !!id && id !== "",
  });

  useScreenReady(!isLoading);

  const rep = (representative as any)?.data || representative;

  const handleEdit = () => {
    if (rep) {
      router.push(routeToMobilePath(routes.administration.representatives.edit(rep.id)) as any);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      Alert.alert("Sucesso", "Dados atualizados com sucesso");
    });
  }, [refetch]);

  if (isLoading) {
    const cardStyle = {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    };
    const sectionHeaderStyle = {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
      paddingBottom: spacing.sm,
      marginBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    };
    const infoRow = (i: number) => (
      <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.xs }}>
        <Skeleton width="30%" height={14} />
        <Skeleton width="45%" height={14} />
      </View>
    );
    return (
      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Header card: name + edit button */}
          <View style={[cardStyle, { paddingHorizontal: spacing.md, paddingVertical: spacing.xs }]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.xs }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
                <Skeleton width={24} height={24} borderRadius={4} />
                <Skeleton width="55%" height={22} />
              </View>
              <Skeleton width={36} height={36} borderRadius={borderRadius.md} />
            </View>
          </View>

          {/* Basic Info Card: Nome, Função, Status, Cliente */}
          <View style={cardStyle}>
            <View style={sectionHeaderStyle}>
              <Skeleton width={20} height={20} borderRadius={4} />
              <Skeleton width="45%" height={18} />
            </View>
            <View style={{ gap: spacing.xs }}>
              {[1, 2, 3, 4].map(infoRow)}
            </View>
          </View>

          {/* Contact Card: Telefone, E-mail, Acesso ao Sistema */}
          <View style={cardStyle}>
            <View style={sectionHeaderStyle}>
              <Skeleton width={20} height={20} borderRadius={4} />
              <Skeleton width="25%" height={18} />
            </View>
            <View style={{ gap: spacing.xs }}>
              {[1, 2, 3].map(infoRow)}
            </View>
          </View>

          {/* Changelog Card */}
          <View style={cardStyle}>
            <View style={sectionHeaderStyle}>
              <Skeleton width={20} height={20} borderRadius={4} />
              <Skeleton width="55%" height={18} />
            </View>
            <View style={{ gap: spacing.md }}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={{ flexDirection: "row", gap: spacing.sm }}>
                  <Skeleton width={8} height={8} borderRadius={4} style={{ marginTop: 4 }} />
                  <View style={{ flex: 1, gap: spacing.xs }}>
                    <Skeleton width="40%" height={13} />
                    <Skeleton width="70%" height={12} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: spacing.md }} />
        </View>
      </ScrollView>
    );
  }

  if (error || !rep || !id || id === "") {
    return (
      <View style={[styles.scrollView, { backgroundColor: colors.background }]}>
        <View style={styles.container}>
          <Card style={styles.card}>
            <View style={styles.errorContent}>
              <View style={[styles.errorIcon, { backgroundColor: colors.muted }]}>
                <IconUser size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={[styles.errorTitle, { color: colors.foreground }]}>
                Representante não encontrado
              </ThemedText>
              <ThemedText style={[styles.errorDescription, { color: colors.mutedForeground }]}>
                O representante solicitado não foi encontrado ou pode ter sido removido.
              </ThemedText>
              <Button onPress={() => router.back()}>
                <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
              </Button>
            </View>
          </Card>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={[styles.headerLeft, { flex: 1 }]}>
              <IconUser size={24} color={colors.primary} />
              <ThemedText style={[styles.repName, { color: colors.foreground }]}>
                {rep.name}
              </ThemedText>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleEdit}
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.7}
              >
                <IconEdit size={18} color={colors.primaryForeground} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Basic Info Card */}
        <DetailCard title="Informações Básicas" icon="user">
          <DetailField
            label="Nome"
            value={rep.name}
            icon="user"
          />
          <DetailField
            label="Função"
            value={
              <Badge
                variant={ROLE_BADGE_VARIANTS[rep.role as RepresentativeRole] || 'default'}
                size="sm"
                style={{ alignSelf: 'flex-start' }}
              >
                {REPRESENTATIVE_ROLE_LABELS[rep.role as RepresentativeRole]}
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
          <DetailField
            label="Cliente"
            value={rep.customer?.fantasyName || "-"}
            icon="building"
          />
        </DetailCard>

        {/* Contact Details Card */}
        <DetailCard title="Contato" icon="phone">
          {rep.phone && (
            <DetailPhoneField
              label="Telefone"
              phone={rep.phone}
              icon="phone"
            />
          )}
          <DetailField
            label="E-mail"
            value={rep.email || "-"}
            icon="mail"
          />
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

        {/* Changelog Timeline */}
        <Card style={styles.card}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <IconHistory size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.sectionTitle}>Histórico de Alterações</ThemedText>
          </View>
          <View style={styles.content}>
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.REPRESENTATIVE}
              entityId={rep.id}
              entityName={rep.name}
              entityCreatedAt={rep.createdAt}
              maxHeight={400}
            />
          </View>
        </Card>

        <View style={{ height: spacing.md }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  headerCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  repName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
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
  content: {
    gap: spacing.md,
  },
  errorContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
});
