import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useUser, useScreenReady} from '@/hooks';
import { useNav } from "@/contexts/nav";
import { routes, CHANGE_LOG_ENTITY_TYPE, CONTRACT_TYPE, CONTRACT_STATUS, CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS, EMPLOYEE_TYPE_LABELS } from '@/constants';
import { getExperiencePhase, getDaysRemainingInExperiencePeriod } from "@/utils/user";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import {
  IconUser,
  IconRefresh,
  IconEdit,
  IconBriefcase,
  IconAlertTriangle,
  IconClipboardList,
  IconShield,
  IconHistory,
  IconMail,
  IconPhone,
  IconIdBadge,
} from "@tabler/icons-react-native";
import { mobileRoute } from "@/constants/routes.types";
// import { showToast } from "@/components/ui/toast";
import { EmployeeDetailSkeleton } from "@/components/administration/employee/skeleton";
import {
  WarningsTable,
  BorrowsTable,
  PpeDeliveriesTable,
} from "@/components/administration/employee/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { UserPositionHistoryCard } from "@/components/human-resources/user-position-history";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// Badge variant for the lifecycle STATUS (situação). Orthogonal to the modality.
const getStatusBadgeVariant = (status: CONTRACT_STATUS | string | null | undefined) => {
  switch (status) {
    case CONTRACT_STATUS.ACTIVE:
      return "default";
    case CONTRACT_STATUS.TERMINATED:
      return "destructive";
    default:
      return "outline";
  }
};

// Label for the lifecycle STATUS (situação).
const getStatusLabel = (status: CONTRACT_STATUS | string | null | undefined) => {
  if (!status) return "Desconhecido";
  return CONTRACT_STATUS_LABELS[status as CONTRACT_STATUS] || status;
};

// Label for the contract MODALITY (tipo de vínculo).
const getModalityLabel = (type: CONTRACT_TYPE | string | null | undefined) => {
  if (!type) return "—";
  return CONTRACT_TYPE_LABELS[type as CONTRACT_TYPE] || type;
};

export default function EmployeeDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const nav = useNav();
  const goBack = () => nav.goBack();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useUser(id, {
    // NOTE: the GetById endpoint honors `include` (not `select`) for relations,
    // so relations must be requested via include or they silently fall back to
    // the default include and never load.
    include: {
      // Current vínculo (employment contract) — carries the employment dates
      currentContract: true,
      // Full vínculo history (read-only "Histórico de Vínculos")
      contracts: {
        orderBy: { sequence: "asc" },
      },
      position: true,
      sector: true,
      ppeSize: true, // Full PPE size for detail display
      warningsCollaborator: true,
      borrows: {
        include: {
          item: true,
        },
        where: {
          status: "ACTIVE",
        },
        take: 5,
      },
      ppeDeliveries: {
        include: {
          item: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: {
        select: {
          createdTasks: true,
          warningsCollaborator: true,
          borrows: true,
          ppeDeliveries: true,
          bonuses: true,
        },
      },
    },
    enabled: !!id && id !== "",
  });

  useScreenReady(!isLoading);

  const employee = response?.data;

  const handleEdit = () => {
    if (employee) {
      nav.push(mobileRoute(routes.humanResources.employees.edit(employee.id)));
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
    return (
      <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <EmployeeDetailSkeleton />
        </View>
      </ScrollView>
    );
  }

  if (error || !employee || !id || id === "") {
    return (
      <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card>
            <CardContent style={styles.errorContent}>
              <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                <IconUser size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                Funcionário não encontrado
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                O funcionário solicitado não foi encontrado ou pode ter sido removido.
              </ThemedText>
              <Button onPress={() => goBack()}>
                <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
              </Button>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    );
  }

  // Calculate employment duration
  const employmentDays = employee.createdAt
    ? differenceInDays(new Date(), new Date(employee.createdAt))
    : 0;

  // Experiência is now derived from the contract MODALITY (EXPERIENCE_PERIOD_n);
  // phase + remaining days are derived centrally.
  const contract = employee.currentContract;
  const isInExperience =
    employee.currentContractType === CONTRACT_TYPE.EXPERIENCE_PERIOD_1 ||
    employee.currentContractType === CONTRACT_TYPE.EXPERIENCE_PERIOD_2;
  const experiencePhase = getExperiencePhase(employee);
  const experienceDaysRemaining = getDaysRemainingInExperiencePeriod(employee);

  return (
    <ScrollView
      style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
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
        {/* Employee Header Card */}
        <Card>
          <CardContent style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={StyleSheet.flatten([styles.avatarContainer, { backgroundColor: colors.primary + "20" }])}>
                <IconUser size={24} color={colors.primary} />
              </View>
              <View style={styles.headerInfo}>
                <ThemedText style={StyleSheet.flatten([styles.employeeName, { color: colors.foreground }])}>
                  {employee.name}
                </ThemedText>
                <View style={styles.headerMeta}>
                  <Badge
                    variant={getStatusBadgeVariant(employee.currentContractStatus)}
                    size="sm"
                  >
                    <ThemedText style={{ fontSize: 11 }}>
                      {getStatusLabel(employee.currentContractStatus)}
                      {isInExperience && experiencePhase ? ` (Fase ${experiencePhase})` : ""}
                    </ThemedText>
                  </Badge>
                  {employee.currentContractType && (
                    <Badge variant="outline" size="sm">
                      <ThemedText style={{ fontSize: 11 }}>
                        {getModalityLabel(employee.currentContractType)}
                      </ThemedText>
                    </Badge>
                  )}
                  {experienceDaysRemaining !== null && experienceDaysRemaining > 0 && (
                    <ThemedText style={StyleSheet.flatten([styles.experienceRemaining, { color: colors.mutedForeground }])}>
                      {experienceDaysRemaining} dias restantes
                    </ThemedText>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleRefresh}
                style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.muted }])}
                activeOpacity={0.7}
                disabled={refreshing}
              >
                <IconRefresh size={18} color={colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEdit}
                style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.primary }])}
                activeOpacity={0.7}
              >
                <IconEdit size={18} color={colors.primaryForeground} />
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <View
                style={[
                  styles.statIcon,
                  {
                    backgroundColor: isDark ? extendedColors.blue[900] + "40" : extendedColors.blue[100],
                  },
                ]}
              >
                <IconClipboardList
                  size={20}
                  color={isDark ? extendedColors.blue[400] : extendedColors.blue[600]}
                />
              </View>
              <View style={styles.statInfo}>
                <ThemedText style={StyleSheet.flatten([styles.statValue, { color: colors.foreground }])}>
                  {employee._count?.createdTasks || 0}
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>
                  tarefas
                </ThemedText>
              </View>
            </CardContent>
          </Card>

          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <View
                style={[
                  styles.statIcon,
                  {
                    backgroundColor: isDark ? extendedColors.yellow[900] + "40" : extendedColors.yellow[100],
                  },
                ]}
              >
                <IconAlertTriangle
                  size={20}
                  color={isDark ? extendedColors.yellow[400] : extendedColors.yellow[600]}
                />
              </View>
              <View style={styles.statInfo}>
                <ThemedText style={StyleSheet.flatten([styles.statValue, { color: colors.foreground }])}>
                  {employee._count?.warningsCollaborator || 0}
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>
                  avisos
                </ThemedText>
              </View>
            </CardContent>
          </Card>

          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <View
                style={[
                  styles.statIcon,
                  {
                    backgroundColor: isDark ? extendedColors.purple[900] + "40" : extendedColors.purple[100],
                  },
                ]}
              >
                <IconShield
                  size={20}
                  color={isDark ? extendedColors.purple[400] : extendedColors.purple[600]}
                />
              </View>
              <View style={styles.statInfo}>
                <ThemedText style={StyleSheet.flatten([styles.statValue, { color: colors.foreground }])}>
                  {employee._count?.ppeDeliveries || 0}
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>
                  EPIs
                </ThemedText>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Personal Information Card */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconIdBadge size={20} color={colors.mutedForeground} />
              <ThemedText style={[styles.title, { color: colors.foreground }]}>
                Informações Pessoais
              </ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <View style={styles.infoItem}>
              <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>
                CPF
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>
                {employee.cpf || "Não informado"}
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>
                PIS
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>
                {employee.pis || "Não informado"}
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>
                Data de Nascimento
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>
                {employee.birth
                  ? format(new Date(employee.birth), "dd/MM/yyyy", { locale: ptBR })
                  : "Não informado"}
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>
                Tempo de Empresa
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>
                {employmentDays} dias
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Contact Information Card */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconPhone size={20} color={colors.mutedForeground} />
              <ThemedText style={[styles.title, { color: colors.foreground }]}>
                Informações de Contato
              </ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            {employee.email && (
              <TouchableOpacity style={styles.contactItem} activeOpacity={0.7}>
                <IconMail size={18} color={colors.mutedForeground} />
                <ThemedText style={StyleSheet.flatten([styles.contactText, { color: colors.foreground }])}>
                  {employee.email}
                </ThemedText>
              </TouchableOpacity>
            )}
            {employee.phone && (
              <TouchableOpacity style={styles.contactItem} activeOpacity={0.7}>
                <IconPhone size={18} color={colors.mutedForeground} />
                <ThemedText style={StyleSheet.flatten([styles.contactText, { color: colors.foreground }])}>
                  {employee.phone}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Professional Information Card */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconBriefcase size={20} color={colors.mutedForeground} />
              <ThemedText style={[styles.title, { color: colors.foreground }]}>
                Informações Profissionais
              </ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <View style={styles.infoItem}>
              <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>
                Cargo
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>
                {employee.position?.name || "Não informado"}
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>
                Setor
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>
                {employee.sector?.name || "Não informado"}
              </ThemedText>
            </View>
            {(contract?.admissionDate ?? contract?.exp1StartAt) && (
              <View style={styles.infoItem}>
                <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>
                  Data de Admissão
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>
                  {format(new Date((contract?.admissionDate ?? contract?.exp1StartAt) as Date), "dd/MM/yyyy", { locale: ptBR })}
                </ThemedText>
              </View>
            )}
            {contract?.terminationDate && (
              <View style={styles.infoItem}>
                <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>
                  Data de Desligamento
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>
                  {format(new Date(contract.terminationDate), "dd/MM/yyyy", { locale: ptBR })}
                </ThemedText>
              </View>
            )}
          </View>
        </Card>

        {/* Histórico de Vínculos (read-only) */}
        {Array.isArray(employee.contracts) && employee.contracts.length > 0 && (
          <Card>
            <CardContent>
              <View style={styles.cardHeaderRow}>
                <IconHistory size={18} color={colors.foreground} />
                <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground, fontWeight: fontWeight.semibold }])}>
                  Histórico de Vínculos
                </ThemedText>
              </View>
              {employee.contracts.map((vinculo) => {
                const admission = vinculo.admissionDate ?? vinculo.exp1StartAt;
                return (
                  <View
                    key={vinculo.id}
                    style={StyleSheet.flatten([styles.infoItem, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm }])}
                  >
                    <View style={styles.headerMeta}>
                      <Badge
                        variant={getStatusBadgeVariant(vinculo.status)}
                        size="sm"
                      >
                        <ThemedText style={{ fontSize: 11 }}>
                          {getStatusLabel(vinculo.status)}
                        </ThemedText>
                      </Badge>
                      {vinculo.contractType && (
                        <Badge variant="outline" size="sm">
                          <ThemedText style={{ fontSize: 11 }}>
                            {getModalityLabel(vinculo.contractType)}
                          </ThemedText>
                        </Badge>
                      )}
                      <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>
                        #{vinculo.sequence}
                        {vinculo.employeeType ? ` · ${EMPLOYEE_TYPE_LABELS[vinculo.employeeType] || vinculo.employeeType}` : ""}
                      </ThemedText>
                    </View>
                    <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>
                      {admission ? format(new Date(admission), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                      {vinculo.terminationDate ? ` até ${format(new Date(vinculo.terminationDate), "dd/MM/yyyy", { locale: ptBR })}` : " · atual"}
                    </ThemedText>
                  </View>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Histórico de Cargos (position-history timeline) */}
        <UserPositionHistoryCard userId={employee.id} />

        {/* Relation Tables */}
        <WarningsTable employee={employee} maxHeight={400} />
        <BorrowsTable employee={employee} maxHeight={400} />
        <PpeDeliveriesTable employee={employee} maxHeight={400} />

        {/* Changelog Timeline */}
        <Card>
          <CardContent style={styles.changelogHeader}>
            <View style={styles.titleRow}>
              <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
                <IconHistory size={18} color={colors.primary} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
                Histórico de Alterações
              </ThemedText>
            </View>
          </CardContent>
          <CardContent>
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.USER}
              entityId={employee.id}
              entityName={employee.name}
              entityCreatedAt={employee.createdAt}
              maxHeight={400}
            />
          </CardContent>
        </Card>

        {/* Bottom spacing for mobile navigation */}
        <View style={{ height: spacing.xxl * 2 }} />
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
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
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
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  experienceRemaining: {
    fontSize: fontSize.xs,
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
  errorContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
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
    paddingHorizontal: spacing.xl,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: "47%",
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  infoGrid: {
    gap: spacing.lg,
  },
  infoItem: {
    gap: spacing.xs,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  contactGrid: {
    gap: spacing.md,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  contactText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  listContainer: {
    gap: 0,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  listItemContent: {
    flex: 1,
    gap: spacing.xs,
  },
  listItemTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  listItemSubtitle: {
    fontSize: fontSize.xs,
  },
  listItemDate: {
    fontSize: fontSize.xs,
  },
  changelogHeader: {
    paddingBottom: 0,
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
});