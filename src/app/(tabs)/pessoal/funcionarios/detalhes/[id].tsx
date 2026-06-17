import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useUser } from "@/hooks";
import { CONTRACT_TYPE, CONTRACT_STATUS, CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS, EMPLOYEE_TYPE_LABELS, routes } from "@/constants";
import { getExperiencePhase, getDaysRemainingInExperiencePeriod } from "@/utils/user";
import { mobileRoute } from "@/constants/routes.types";
import { spacing, fontSize } from "@/constants/design-system";
import {
  IconUser,
  IconPhone,
  IconMail,
  IconBriefcase,
  IconCalendar,
  IconBuilding,
  IconStar,
} from "@tabler/icons-react-native";
import { formatDate } from "@/utils";
import { getFileUrl } from "@/utils/file-utils";
import type { User } from "@/types";

import { DetailScreen } from "@/components/screens/detail-screen";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";

// Label for the contract MODALITY (tipo de vínculo).
const getModalityLabel = (type: string | null | undefined) => {
  if (!type) return "—";
  return CONTRACT_TYPE_LABELS[type as CONTRACT_TYPE] || type;
};

// Label for the lifecycle STATUS (situação).
const getStatusLabel = (status: string | null | undefined) => {
  if (!status) return "Desconhecido";
  return CONTRACT_STATUS_LABELS[status as CONTRACT_STATUS] || status;
};

// Color keyed on the lifecycle STATUS (situação).
const getStatusColor = (status: string | null | undefined, colors: any) => {
  const statusColors: Record<string, string> = {
    [CONTRACT_STATUS.ACTIVE]: colors.success,
    [CONTRACT_STATUS.TERMINATED]: colors.destructive,
  };
  return (status && statusColors[status]) || colors.mutedForeground;
};

const getEmploymentDuration = (
  admissionDate: Date | string | null | undefined,
  terminationDate?: Date | string | null,
) => {
  if (!admissionDate) return null;

  const startDate = new Date(admissionDate);
  const endDate = terminationDate ? new Date(terminationDate) : new Date();

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

  const parts: string[] = [];
  if (finalYears > 0) parts.push(`${finalYears} ano${finalYears > 1 ? "s" : ""}`);
  if (finalMonths > 0) parts.push(`${finalMonths} mês${finalMonths > 1 ? "es" : ""}`);
  if (totalDays > 0 && parts.length === 0)
    parts.push(`${totalDays} dia${totalDays > 1 ? "s" : ""}`);

  return parts.join(" e ") || "Menos de 1 dia";
};

export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const query = useUser(id || "", {
    // GetById honors `include` (not `select`) for relations — request relations
    // via include or currentContract/avatar/etc. never load.
    include: {
      currentContract: true,
      avatar: true,
      position: true,
      sector: true,
      ledSector: true,
    },
    enabled: !!id && id !== "",
  });

  return (
    <DetailScreen<User>
      query={query as any}
      icon={IconUser}
      title={(e) => e.name || "Funcionário"}
      // Read-only mirror — funcionários listados são apenas visualizados.
      editGuard={{ editable: [] }}
      notFoundFallback={mobileRoute("/pessoal/funcionarios")}
    >
      {(employee) => {
        const contract = employee.currentContract;
        const admissionDate = contract?.admissionDate ?? contract?.exp1StartAt;
        const terminationDate = contract?.terminationDate;
        const isDismissed = employee.currentContractStatus === CONTRACT_STATUS.TERMINATED;
        const isInExperience =
          employee.currentContractType === CONTRACT_TYPE.EXPERIENCE_PERIOD_1 ||
          employee.currentContractType === CONTRACT_TYPE.EXPERIENCE_PERIOD_2;
        const employmentDuration = getEmploymentDuration(admissionDate, terminationDate);
        const experiencePhase = getExperiencePhase(employee);
        const experienceDaysLeft = getDaysRemainingInExperiencePeriod(employee);

        return (
          <View style={styles.body}>
            {/* Header card */}
            <Card style={styles.headerCard}>
              <View style={styles.headerContent}>
                <Avatar
                  imageUrl={
                    employee.avatar?.id
                      ? getFileUrl(employee.avatar as any)
                      : undefined
                  }
                  name={employee.name || "F"}
                  size="lg"
                />
                <View style={styles.headerInfo}>
                  <ThemedText
                    style={[styles.employeeName, { color: colors.foreground }]}
                  >
                    {employee.name}
                  </ThemedText>
                  {employee.position && (
                    <ThemedText
                      style={[
                        styles.employeePosition,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {employee.position.name}
                    </ThemedText>
                  )}
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor:
                        getStatusColor(employee.currentContractStatus, colors) + "20",
                      marginTop: spacing.xs,
                    }}
                  >
                    <ThemedText
                      style={[
                        styles.statusText,
                        { color: getStatusColor(employee.currentContractStatus, colors) },
                      ]}
                    >
                      {getStatusLabel(employee.currentContractStatus)}
                      {isInExperience && experiencePhase ? ` (Fase ${experiencePhase})` : ""}
                    </ThemedText>
                  </Badge>
                </View>
              </View>
            </Card>

            {/* Contact */}
            <Card style={styles.card}>
              <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.sectionHeaderLeft}>
                  <IconPhone size={20} color={colors.mutedForeground} />
                  <ThemedText
                    style={[styles.sectionTitle, { color: colors.foreground }]}
                  >
                    Informações de Contato
                  </ThemedText>
                </View>
              </View>
              <View style={styles.sectionContent}>
                {employee.email && (
                  <InfoRow
                    icon={<IconMail size={16} color={colors.mutedForeground} />}
                    label="E-mail"
                    value={employee.email}
                    colors={colors}
                  />
                )}
                {employee.phone && (
                  <InfoRow
                    icon={<IconPhone size={16} color={colors.mutedForeground} />}
                    label="Telefone"
                    value={employee.phone}
                    colors={colors}
                  />
                )}
              </View>
            </Card>

            {/* Professional */}
            <Card style={styles.card}>
              <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.sectionHeaderLeft}>
                  <IconBriefcase size={20} color={colors.mutedForeground} />
                  <ThemedText
                    style={[styles.sectionTitle, { color: colors.foreground }]}
                  >
                    Informações Profissionais
                  </ThemedText>
                </View>
              </View>
              <View style={styles.sectionContent}>
                {employee.position && (
                  <InfoRow
                    icon={<IconBriefcase size={16} color={colors.mutedForeground} />}
                    label="Cargo"
                    value={employee.position.name}
                    colors={colors}
                  />
                )}
                {employee.sector && (
                  <InfoRow
                    icon={<IconBuilding size={16} color={colors.mutedForeground} />}
                    label="Setor"
                    value={employee.sector.name}
                    colors={colors}
                  />
                )}
                {employee.ledSector && (
                  <InfoRow
                    icon={<IconStar size={16} color={colors.mutedForeground} />}
                    label="Setor Liderado"
                    value={employee.ledSector.name}
                    colors={colors}
                  />
                )}
                {employee.currentEmployeeType && (
                  <InfoRow
                    icon={<IconBriefcase size={16} color={colors.mutedForeground} />}
                    label="Categoria"
                    value={EMPLOYEE_TYPE_LABELS[employee.currentEmployeeType] || employee.currentEmployeeType}
                    colors={colors}
                  />
                )}
                {employee.currentContractType && (
                  <InfoRow
                    icon={<IconBriefcase size={16} color={colors.mutedForeground} />}
                    label="Modalidade do vínculo"
                    value={getModalityLabel(employee.currentContractType)}
                    colors={colors}
                  />
                )}
                {employee.currentContractStatus && (
                  <InfoRow
                    icon={<IconBriefcase size={16} color={colors.mutedForeground} />}
                    label="Situação"
                    value={getStatusLabel(employee.currentContractStatus)}
                    colors={colors}
                  />
                )}
                {isInExperience && experiencePhase && (
                  <InfoRow
                    icon={<IconCalendar size={16} color={colors.warning} />}
                    label="Experiência"
                    value={`Fase ${experiencePhase}${experienceDaysLeft !== null ? ` · ${experienceDaysLeft} dia(s) restantes` : ""}`}
                    colors={colors}
                  />
                )}
                {contract?.effectedAt && (
                  <InfoRow
                    icon={<IconCalendar size={16} color={colors.success} />}
                    label="Efetivado em"
                    value={formatDate(contract.effectedAt)}
                    colors={colors}
                  />
                )}
                {contract?.stabilityEnd && (
                  <InfoRow
                    icon={<IconCalendar size={16} color={colors.warning} />}
                    label="Estabilidade até"
                    value={formatDate(contract.stabilityEnd)}
                    colors={colors}
                  />
                )}
                {admissionDate && (
                  <View style={styles.infoRow}>
                    <IconCalendar size={16} color={colors.mutedForeground} />
                    <View style={styles.infoTextContainer}>
                      <ThemedText
                        style={[styles.infoLabel, { color: colors.mutedForeground }]}
                      >
                        Data de Admissão
                      </ThemedText>
                      <ThemedText
                        style={[styles.infoValue, { color: colors.foreground }]}
                      >
                        {formatDate(admissionDate)}
                      </ThemedText>
                      {employmentDuration && (
                        <ThemedText
                          style={[
                            styles.infoSubValue,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {terminationDate ? "Trabalhou por" : "Há"}{" "}
                          {employmentDuration}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                )}
                {terminationDate && (
                  <View style={styles.infoRow}>
                    <IconCalendar size={16} color={colors.destructive} />
                    <View style={styles.infoTextContainer}>
                      <ThemedText
                        style={[styles.infoLabel, { color: colors.mutedForeground }]}
                      >
                        Data de Demissão
                      </ThemedText>
                      <ThemedText
                        style={[styles.infoValue, { color: colors.destructive }]}
                      >
                        {formatDate(terminationDate)}
                      </ThemedText>
                    </View>
                  </View>
                )}
                {employee.performanceLevel !== undefined && (
                  <View style={styles.infoRow}>
                    <IconStar size={16} color={colors.mutedForeground} />
                    <View style={styles.infoTextContainer}>
                      <ThemedText
                        style={[styles.infoLabel, { color: colors.mutedForeground }]}
                      >
                        Nível de Desempenho
                      </ThemedText>
                      <View style={styles.performanceContainer}>
                        {[1, 2, 3, 4, 5].map((level) => (
                          <IconStar
                            key={level}
                            size={18}
                            color={
                              level <= employee.performanceLevel
                                ? colors.warning
                                : colors.muted
                            }
                            fill={
                              level <= employee.performanceLevel
                                ? colors.warning
                                : "none"
                            }
                          />
                        ))}
                        <ThemedText
                          style={[styles.performanceText, { color: colors.foreground }]}
                        >
                          {employee.performanceLevel}/5
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </Card>

            {/* Notice */}
            <Card style={[styles.noticeCard, { backgroundColor: colors.muted }]}>
              <IconUser size={20} color={colors.mutedForeground} />
              <ThemedText
                style={[styles.noticeText, { color: colors.mutedForeground }]}
              >
                Esta visualização contém apenas informações públicas do funcionário.
                Informações sensíveis como documentos, salário e dados pessoais estão
                restritas.
              </ThemedText>
            </Card>
          </View>
        );
      }}
    </DetailScreen>
  );
}

function InfoRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={styles.infoRow}>
      {icon}
      <View style={styles.infoTextContainer}>
        <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
          {label}
        </ThemedText>
        <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
          {value}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
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
    padding: spacing.md,
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
});
