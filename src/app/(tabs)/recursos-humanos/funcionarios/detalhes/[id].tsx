import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useUser } from '@/hooks';
import { routes, CHANGE_LOG_ENTITY_TYPE, USER_STATUS } from '@/constants';
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
  IconCalendarCheck,
  IconAlertTriangle,
  IconClipboardList,
  IconShield,
  IconHistory,
  IconMail,
  IconPhone,
  IconIdBadge,
} from "@tabler/icons-react-native";
import { routeToMobilePath } from '@/utils/route-mapper';
// import { showToast } from "@/components/ui/toast";
import { EmployeeDetailSkeleton } from "@/components/administration/employee/skeleton";
import {
  VacationsTable,
  WarningsTable,
  BorrowsTable,
  PpeDeliveriesTable,
} from "@/components/administration/employee/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// Helper function to get status badge variant
const getStatusBadgeVariant = (status: USER_STATUS) => {
  switch (status) {
    case USER_STATUS.EFFECTED:
      return "default";
    case USER_STATUS.EXPERIENCE_PERIOD_1:
    case USER_STATUS.EXPERIENCE_PERIOD_2:
      return "secondary";
    case USER_STATUS.DISMISSED:
      return "destructive";
    default:
      return "outline";
  }
};

// Helper function to get status label
const getStatusLabel = (status: USER_STATUS) => {
  switch (status) {
    case USER_STATUS.EFFECTED:
      return "Efetivo";
    case USER_STATUS.EXPERIENCE_PERIOD_1:
      return "Experiência 1";
    case USER_STATUS.EXPERIENCE_PERIOD_2:
      return "Experiência 2";
    case USER_STATUS.DISMISSED:
      return "Desligado";
    default:
      return "Desconhecido";
  }
};

export default function EmployeeDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useUser(id, {
    // Use optimized select for better performance - fetches only fields needed for HR employee detail view
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      cpf: true,
      pis: true,
      birth: true,
      status: true,
      statusOrder: true,
      isActive: true,
      verified: true,
      avatarId: true,
      payrollNumber: true,
      performanceLevel: true,
      admissional: true,
      // Status tracking dates
      effectedAt: true,
      exp1StartAt: true,
      exp1EndAt: true,
      exp2StartAt: true,
      exp2EndAt: true,
      dismissedAt: true,
      // Timestamps
      createdAt: true,
      updatedAt: true,
      // Relations with minimal select
      position: {
        select: {
          id: true,
          name: true,
          hierarchy: true,
        },
      },
      sector: {
        select: {
          id: true,
          name: true,
        },
      },
      ppeSize: true, // Full PPE size for detail display
      vacations: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          status: true,
          createdAt: true,
        },
        orderBy: { startDate: "desc" },
        take: 5,
      },
      warningsCollaborator: {
        select: {
          id: true,
          type: true,
          reason: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      borrows: {
        select: {
          id: true,
          quantity: true,
          status: true,
          createdAt: true,
          item: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        where: {
          status: "ACTIVE",
        },
        take: 5,
      },
      ppeDeliveries: {
        select: {
          id: true,
          quantity: true,
          createdAt: true,
          item: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: {
        select: {
          tasks: true,
          createdTasks: true,
          vacations: true,
          warningsCollaborator: true,
          borrows: true,
          ppeDeliveries: true,
          bonuses: true,
        },
      },
    },
    enabled: !!id && id !== "",
  });

  const employee = response?.data;

  const handleEdit = () => {
    if (employee) {
      router.push(routeToMobilePath(routes.humanResources.employees.edit(employee.id)) as any);
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
              <Button onPress={() => router.back()}>
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

  // Calculate experience period remaining days
  const getExperienceDaysRemaining = () => {
    if (employee.status === USER_STATUS.EXPERIENCE_PERIOD_1 && employee.exp1EndAt) {
      return differenceInDays(new Date(employee.exp1EndAt), new Date());
    }
    if (employee.status === USER_STATUS.EXPERIENCE_PERIOD_2 && employee.exp2EndAt) {
      return differenceInDays(new Date(employee.exp2EndAt), new Date());
    }
    return null;
  };

  const experienceDaysRemaining = getExperienceDaysRemaining();

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
                  <Badge variant={getStatusBadgeVariant(employee.status as USER_STATUS)} size="sm">
                    <ThemedText style={{ fontSize: 11 }}>
                      {getStatusLabel(employee.status as USER_STATUS)}
                    </ThemedText>
                  </Badge>
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
                  {employee._count?.tasks || 0}
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
                    backgroundColor: isDark ? extendedColors.green[900] + "40" : extendedColors.green[100],
                  },
                ]}
              >
                <IconCalendarCheck
                  size={20}
                  color={isDark ? extendedColors.green[400] : extendedColors.green[600]}
                />
              </View>
              <View style={styles.statInfo}>
                <ThemedText style={StyleSheet.flatten([styles.statValue, { color: colors.foreground }])}>
                  {employee._count?.vacations || 0}
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>
                  férias
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
                  {employee._count?.warnings || 0}
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
                  {employee._count?.ppeRequests || 0}
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
            {employee.admissional && (
              <View style={styles.infoItem}>
                <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>
                  Data de Admissão
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>
                  {format(new Date(employee.admissional), "dd/MM/yyyy", { locale: ptBR })}
                </ThemedText>
              </View>
            )}
            {employee.dismissedAt && (
              <View style={styles.infoItem}>
                <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>
                  Data de Desligamento
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>
                  {format(new Date(employee.dismissedAt), "dd/MM/yyyy", { locale: ptBR })}
                </ThemedText>
              </View>
            )}
          </View>
        </Card>

        {/* Relation Tables */}
        <VacationsTable employee={employee} maxHeight={400} />
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