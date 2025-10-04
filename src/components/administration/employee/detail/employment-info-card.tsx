import React from "react";
import { View, StyleSheet } from "react-native";
import { User } from '../../../../types';
import { formatDate, formatCurrency, getAge } from '../../../../utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailRow } from "@/components/ui/detail-row";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconBriefcase, IconCalendar, IconBuilding, IconCurrencyDollar, IconUserCheck } from "@tabler/icons-react-native";

interface EmploymentInfoCardProps {
  employee: User;
}

export function EmploymentInfoCard({ employee }: EmploymentInfoCardProps) {
  const { colors } = useTheme();

  const formattedHireDate = employee.hireDate ? formatDate(employee.hireDate) : "Não informado";
  const formattedAdmissional = employee.admissional ? formatDate(employee.admissional) : "Não informado";
  const formattedDismissal = employee.dismissal ? formatDate(employee.dismissal) : "-";

  // Calculate time at company
  const getTimeAtCompany = () => {
    if (!employee.hireDate) return "Não informado";

    const now = employee.dismissal || new Date();
    const years = Math.floor((now.getTime() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((now.getTime() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 30)) % 12;

    if (years > 0) {
      return `${years} ano${years > 1 ? "s" : ""} e ${months} ${months === 1 ? "mês" : "meses"}`;
    }
    return `${months} ${months === 1 ? "mês" : "meses"}`;
  };

  const timeAtCompany = getTimeAtCompany();

  // Get position salary if available
  const salary = employee.position?.baseSalary
    ? formatCurrency(employee.position.baseSalary)
    : "Não informado";

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
              <IconBriefcase size={18} color={colors.primary} />
            </View>
            <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
              Informações de Emprego
            </ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent style={styles.content}>
        {employee.position && (
          <DetailRow
            icon={IconBriefcase}
            label="Cargo"
            value={employee.position.name}
          />
        )}

        {employee.sector && (
          <DetailRow
            icon={IconBuilding}
            label="Setor"
            value={employee.sector.name}
          />
        )}

        {employee.managedSector && (
          <DetailRow
            icon={IconUserCheck}
            label="Setor Gerenciado"
            value={employee.managedSector.name}
          />
        )}

        <DetailRow
          icon={IconCalendar}
          label="Data de Contratação"
          value={formattedHireDate}
        />

        <DetailRow
          icon={IconCalendar}
          label="Data de Admissão"
          value={formattedAdmissional}
        />

        {employee.dismissal && (
          <DetailRow
            icon={IconCalendar}
            label="Data de Desligamento"
            value={formattedDismissal}
          />
        )}

        <DetailRow
          icon={IconCalendar}
          label="Tempo na Empresa"
          value={timeAtCompany}
        />

        {employee.position?.baseSalary && (
          <DetailRow
            icon={IconCurrencyDollar}
            label="Salário Base"
            value={salary}
          />
        )}

        {employee.payrollNumber && (
          <DetailRow
            icon={IconUserCheck}
            label="Número de Folha"
            value={employee.payrollNumber.toString()}
          />
        )}

        {employee.secullumId && (
          <DetailRow
            icon={IconUserCheck}
            label="ID Secullum"
            value={employee.secullumId}
          />
        )}

        {/* Performance Level */}
        {employee.performanceLevel !== undefined && employee.performanceLevel !== null && (
          <View style={styles.performanceRow}>
            <View style={styles.performanceLabel}>
              <IconUserCheck size={20} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Nível de Desempenho
              </ThemedText>
            </View>
            <Badge
              variant={
                employee.performanceLevel >= 4 ? "success" :
                employee.performanceLevel >= 3 ? "info" :
                employee.performanceLevel >= 2 ? "warning" :
                "destructive"
              }
            >
              Nível {employee.performanceLevel}
            </Badge>
          </View>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
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
  content: {
    gap: spacing.md,
  },
  performanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  performanceLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
