import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useUser } from "@/hooks";
import { CONTRACT_TYPE, CONTRACT_STATUS, CONTRACT_TYPE_LABELS, routes } from "@/constants";
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

const getStatusLabel = (status: string | null | undefined) => {
  if (!status) return "Desconhecido";
  return CONTRACT_TYPE_LABELS[status as CONTRACT_TYPE] || status;
};

const getStatusColor = (status: string | null | undefined, colors: any) => {
  const statusColors: Record<string, string> = {
    [CONTRACT_TYPE.EXPERIENCE_PERIOD_1]: colors.warning,
    [CONTRACT_TYPE.EXPERIENCE_PERIOD_2]: colors.warning,
    [CONTRACT_TYPE.EFFECTED]: colors.success,
    [CONTRACT_TYPE.APPRENTICE]: colors.success,
    [CONTRACT_TYPE.INTERMITTENT]: colors.success,
    [CONTRACT_TYPE.FIXED_TERM]: colors.success,
    [CONTRACT_TYPE.TEMPORARY]: colors.success,
    [CONTRACT_STATUS.DISMISSED]: colors.destructive,
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
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      currentContractType: true,
      currentContractStatus: true,
      avatarId: true,
      performanceLevel: true,
      currentContract: true,
      avatar: {
        select: { id: true, thumbnailUrl: true },
      },
      position: {
        select: { id: true, name: true },
      },
      sector: {
        select: { id: true, name: true },
      },
      ledSector: {
        select: { id: true, name: true },
      },
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
        const isDismissed = employee.currentContractStatus === CONTRACT_STATUS.DISMISSED;
        const employmentDuration = getEmploymentDuration(admissionDate, terminationDate);

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
                        getStatusColor(isDismissed ? CONTRACT_STATUS.DISMISSED : employee.currentContractType, colors) + "20",
                      marginTop: spacing.xs,
                    }}
                  >
                    <ThemedText
                      style={[
                        styles.statusText,
                        { color: getStatusColor(isDismissed ? CONTRACT_STATUS.DISMISSED : employee.currentContractType, colors) },
                      ]}
                    >
                      {isDismissed ? "Desligado" : getStatusLabel(employee.currentContractType)}
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
