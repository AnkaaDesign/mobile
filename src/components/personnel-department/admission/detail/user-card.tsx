// user-card.tsx (mobile) — "Colaborador".
// Identity + professional summary of the admission's collaborator. Mirrors web
// src/components/personnel-department/admission/detail/user-card.tsx.

import { View, StyleSheet, TouchableOpacity } from "react-native";
import { IconExternalLink } from "@tabler/icons-react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { Badge, getBadgeVariantFromStatus } from "@/components/ui/badge";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { useNav } from "@/contexts/nav";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatCPF, formatDate, formatDateTime } from "@/utils/formatters";
import { routes, CONTRACT_TYPE_LABELS } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import type { Admission } from "@/types/admission";

interface UserCardProps {
  admission: Admission;
}

export function UserCard({ admission }: UserCardProps) {
  const { colors } = useTheme();
  const nav = useNav();
  const user = admission.user;

  if (!user) {
    return (
      <DetailCard title="Colaborador" icon="user">
        <ThemedText style={[styles.muted, { color: colors.mutedForeground }]}>Colaborador não encontrado.</ThemedText>
      </DetailCard>
    );
  }

  const contractType = user.currentContractType;

  return (
    <DetailCard title="Colaborador" icon="user">
      <View style={styles.fields}>
        <DetailField label="Nome" value={user.name} icon="user" />
        <DetailField label="CPF" value={user.cpf ? formatCPF(user.cpf) : "-"} icon="id" monospace />
        <DetailField label="Nº Folha" value={user.payrollNumber != null ? String(user.payrollNumber) : "-"} icon="hash" />
        <DetailField label="Cargo" value={user.position?.name || "-"} icon="briefcase" />
        <DetailField label="Setor" value={user.sector?.name || "-"} icon="building" />
        <DetailField
          label="Tipo de Contrato"
          icon="file-text"
          value={
            contractType ? (
              <Badge variant={getBadgeVariantFromStatus(contractType, "USER")} size="sm">
                {CONTRACT_TYPE_LABELS[contractType] || contractType}
              </Badge>
            ) : (
              "-"
            )
          }
        />
        <DetailField label="Data de Admissão" value={admission.hireDate ? formatDate(admission.hireDate) : "-"} icon="calendar" />
        <DetailField label="Criado por" value={admission.createdBy?.name || "-"} icon="user-check" />
        <DetailField label="Criado em" value={admission.createdAt ? formatDateTime(admission.createdAt) : "-"} icon="clock" />
        {admission.notes ? <DetailField label="Observações" value={admission.notes} icon="note" /> : null}
      </View>

      <TouchableOpacity
        onPress={() => nav.push(mobileRoute(routes.administration.collaborators.details(user.id)))}
        style={styles.link}
        activeOpacity={0.7}
      >
        <ThemedText style={[styles.linkText, { color: colors.primary }]}>Ver colaborador</ThemedText>
        <IconExternalLink size={14} color={colors.primary} />
      </TouchableOpacity>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.sm },
  muted: { fontSize: fontSize.sm },
  link: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm },
  linkText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});
