import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useUser } from "@/hooks";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import {
  IconUser,
  IconPhone,
  IconMail,
  IconBriefcase,
  IconCalendar,
  IconBuilding,
  IconStar,
} from "@tabler/icons-react-native";
import { USER_STATUS } from "@/constants";
import { formatDate } from "@/utils";
import { showToast } from "@/components/ui/toast";

// Helper function to get status label
const getStatusLabel = (status: string) => {
  const statusLabels: Record<string, string> = {
    [USER_STATUS.EXPERIENCE_PERIOD_1]: "Experiência 1",
    [USER_STATUS.EXPERIENCE_PERIOD_2]: "Experiência 2",
    [USER_STATUS.EFFECTED]: "Efetivo",
    [USER_STATUS.DISMISSED]: "Demitido",
  };
  return statusLabels[status] || status;
};

// Helper function to get status color
const getStatusColor = (status: string, colors: any) => {
  const statusColors: Record<string, string> = {
    [USER_STATUS.EXPERIENCE_PERIOD_1]: colors.warning,
    [USER_STATUS.EXPERIENCE_PERIOD_2]: colors.warning,
    [USER_STATUS.EFFECTED]: colors.success,
    [USER_STATUS.DISMISSED]: colors.destructive,
  };
  return statusColors[status] || colors.mutedForeground;
};

// Helper function to calculate employment duration
const getEmploymentDuration = (admissional: Date | string | null, dismissedAt?: Date | string | null) => {
  if (!admissional) return null;

  const startDate = new Date(admissional);
  const endDate = dismissedAt ? new Date(dismissedAt) : new Date();

  const years = endDate.getFullYear() - startDate.getFullYear();
  const months = endDate.getMonth() - startDate.getMonth();
  const days = endDate.getDate() - startDate.getDate();

  let totalMonths = years * 12 + months;
  let totalDays = days;

  if (totalDays < 0) {
    totalMonths -= 1;
    const previousMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
    totalDays += previousMonth.getDate();
  }

  const finalYears = Math.floor(totalMonths / 12);
  const finalMonths = totalMonths % 12;

  const parts = [];
  if (finalYears > 0) parts.push(`${finalYears} ano${finalYears > 1 ? "s" : ""}`);
  if (finalMonths > 0) parts.push(`${finalMonths} mês${finalMonths > 1 ? "es" : ""}`);
  if (totalDays > 0 && parts.length === 0) parts.push(`${totalDays} dia${totalDays > 1 ? "s" : ""}`);

  return parts.join(" e ") || "Menos de 1 dia";
};

export default function EmployeeDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useUser(id, {
    include: {
      position: true,
      sector: true,
      managedSector: true,
    },
    enabled: !!id && id !== "",
  });

  const employee = response?.data;

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      showToast({ message: "Dados atualizados com sucesso", type: "success" });
    });
  }, [refetch]);

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Card style={styles.loadingCard}>
            <ThemedText style={{ color: colors.mutedForeground }}>
              Carregando dados do funcionário...
            </ThemedText>
          </Card>
        </View>
      </ThemedView>
    );
  }

  if (error || !employee || !id) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Card style={styles.errorCard}>
            <View style={[styles.errorIcon, { backgroundColor: colors.muted }]}>
              <IconUser size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={[styles.errorTitle, { color: colors.foreground }]}>
              Funcionário não encontrado
            </ThemedText>
            <ThemedText style={[styles.errorDescription, { color: colors.mutedForeground }]}>
              O funcionário solicitado não foi encontrado ou pode ter sido removido.
            </ThemedText>
            <Button onPress={() => router.back()}>
              <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
            </Button>
          </Card>
        </View>
      </ThemedView>
    );
  }

  const employmentDuration = getEmploymentDuration(employee.admissional, employee.dismissedAt);

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
            <Avatar
              source={employee.avatar?.url ? { uri: employee.avatar.url } : undefined}
              fallback={employee.name?.[0]?.toUpperCase() || "F"}
              size={80}
            />
            <View style={styles.headerInfo}>
              <ThemedText style={[styles.employeeName, { color: colors.foreground }]}>
                {employee.name}
              </ThemedText>
              {employee.position && (
                <ThemedText style={[styles.employeePosition, { color: colors.mutedForeground }]}>
                  {employee.position.name}
                </ThemedText>
              )}
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: getStatusColor(employee.status, colors) + "20",
                  marginTop: spacing.xs,
                }}
              >
                <ThemedText
                  style={[
                    styles.statusText,
                    { color: getStatusColor(employee.status, colors) },
                  ]}
                >
                  {getStatusLabel(employee.status)}
                </ThemedText>
              </Badge>
            </View>
          </View>
        </Card>

        {/* Contact Information */}
        <Card style={[styles.card, { padding: spacing.md }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.sectionHeaderLeft}>
              <IconPhone size={20} color={colors.mutedForeground} />
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Informações de Contato
              </ThemedText>
            </View>
          </View>
          <View style={styles.sectionContent}>
            {employee.email && (
              <View style={styles.infoRow}>
                <IconMail size={16} color={colors.mutedForeground} />
                <View style={styles.infoTextContainer}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    E-mail
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                    {employee.email}
                  </ThemedText>
                </View>
              </View>
            )}
            {employee.phone && (
              <View style={styles.infoRow}>
                <IconPhone size={16} color={colors.mutedForeground} />
                <View style={styles.infoTextContainer}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Telefone
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                    {employee.phone}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Professional Information */}
        <Card style={[styles.card, { padding: spacing.md }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.sectionHeaderLeft}>
              <IconBriefcase size={20} color={colors.mutedForeground} />
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Informações Profissionais
              </ThemedText>
            </View>
          </View>
          <View style={styles.sectionContent}>
            {employee.position && (
              <View style={styles.infoRow}>
                <IconBriefcase size={16} color={colors.mutedForeground} />
                <View style={styles.infoTextContainer}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Cargo
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                    {employee.position.name}
                  </ThemedText>
                </View>
              </View>
            )}
            {employee.sector && (
              <View style={styles.infoRow}>
                <IconBuilding size={16} color={colors.mutedForeground} />
                <View style={styles.infoTextContainer}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Setor
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                    {employee.sector.name}
                  </ThemedText>
                </View>
              </View>
            )}
            {employee.managedSector && (
              <View style={styles.infoRow}>
                <IconStar size={16} color={colors.mutedForeground} />
                <View style={styles.infoTextContainer}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Setor Gerenciado
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                    {employee.managedSector.name}
                  </ThemedText>
                </View>
              </View>
            )}
            {employee.admissional && (
              <View style={styles.infoRow}>
                <IconCalendar size={16} color={colors.mutedForeground} />
                <View style={styles.infoTextContainer}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Data de Admissão
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                    {formatDate(employee.admissional)}
                  </ThemedText>
                  {employmentDuration && (
                    <ThemedText style={[styles.infoSubValue, { color: colors.mutedForeground }]}>
                      {employee.dismissedAt ? "Trabalhou por" : "Há"} {employmentDuration}
                    </ThemedText>
                  )}
                </View>
              </View>
            )}
            {employee.dismissedAt && (
              <View style={styles.infoRow}>
                <IconCalendar size={16} color={colors.destructive} />
                <View style={styles.infoTextContainer}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Data de Demissão
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.destructive }]}>
                    {formatDate(employee.dismissedAt)}
                  </ThemedText>
                </View>
              </View>
            )}
            {employee.performanceLevel !== undefined && (
              <View style={styles.infoRow}>
                <IconStar size={16} color={colors.mutedForeground} />
                <View style={styles.infoTextContainer}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Nível de Desempenho
                  </ThemedText>
                  <View style={styles.performanceContainer}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <IconStar
                        key={level}
                        size={18}
                        color={level <= employee.performanceLevel ? colors.warning : colors.muted}
                        fill={level <= employee.performanceLevel ? colors.warning : "none"}
                      />
                    ))}
                    <ThemedText style={[styles.performanceText, { color: colors.foreground }]}>
                      {employee.performanceLevel}/5
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Notice Card for Regular Users */}
        <Card style={[styles.noticeCard, { backgroundColor: colors.muted }]}>
          <IconUser size={20} color={colors.mutedForeground} />
          <ThemedText style={[styles.noticeText, { color: colors.mutedForeground }]}>
            Esta visualização contém apenas informações públicas do funcionário.
            Informações sensíveis como documentos, salário e dados pessoais estão restritas.
          </ThemedText>
        </Card>

        {/* Bottom spacing */}
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
  headerCard: {
    padding: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  employeeName: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  employeePosition: {
    fontSize: fontSize.base,
    marginBottom: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  card: {
    padding: 0,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  sectionContent: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  cardContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoTextContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: fontSize.base,
  },
  infoSubValue: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  performanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  performanceText: {
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
  },
  noticeCard: {
    flexDirection: "row",
    padding: spacing.md,
    alignItems: "center",
  },
  noticeText: {
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: fontSize.sm * 1.4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    padding: spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  errorCard: {
    padding: spacing.xl,
    alignItems: "center",
    width: "100%",
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
    fontWeight: "600",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
});