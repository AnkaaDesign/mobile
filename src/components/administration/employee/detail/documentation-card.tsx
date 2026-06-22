// Documentação (Admissão) — mirrors web UserDocumentationCard.
// GATED to ACCOUNTING/HR/ADMIN (PRODUCTION-leak caution); hidden when there are
// no admission documents. Read-only status display (the full upload/sign flow
// lives on the Admissão detail screen).

import { View, StyleSheet } from "react-native";

import type { Admission, AdmissionDocument } from "@/types/admission";
import {
  ADMISSION_DOCUMENT_STATUS,
  ADMISSION_DOCUMENT_STATUS_LABELS,
  ADMISSION_DOCUMENT_TYPE_LABELS,
  SECTOR_PRIVILEGES,
} from "@/constants";
import type { BadgeProps } from "@/components/ui/badge";
import { useAdmissionByUser } from "@/hooks/useAdmission";
import { usePrivileges } from "@/hooks/usePrivileges";
import { getDocumentProgress } from "@/components/personnel-department/admission/utils";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

interface DocumentationCardProps {
  userId: string;
}

const STATUS_BADGE: Record<string, BadgeProps["variant"]> = {
  [ADMISSION_DOCUMENT_STATUS.PENDING]: "pending",
  [ADMISSION_DOCUMENT_STATUS.RECEIVED]: "received",
  [ADMISSION_DOCUMENT_STATUS.SIGNED]: "completed",
  [ADMISSION_DOCUMENT_STATUS.WAIVED]: "secondary",
};

export function DocumentationCard({ userId }: DocumentationCardProps) {
  const { colors } = useTheme();
  const { hasAnyPrivilegeAccess } = usePrivileges();
  const canView = hasAnyPrivilegeAccess([
    SECTOR_PRIVILEGES.ACCOUNTING,
    SECTOR_PRIVILEGES.HUMAN_RESOURCES,
    SECTOR_PRIVILEGES.ADMIN,
  ]);

  const { data, isLoading } = useAdmissionByUser(canView ? userId : undefined, {
    include: { documents: { include: { file: true } } },
  });

  const admission: Admission | null = (data as any)?.data ?? null;
  const documents: AdmissionDocument[] = admission?.documents ?? [];

  if (!canView || isLoading || documents.length === 0) return null;

  const { done, total } = getDocumentProgress(documents);

  return (
    <DetailCard
      title="Documentação"
      icon="file-text"
      badge={
        total > 0 ? (
          <ThemedText style={[styles.progress, { color: done === total ? "#16a34a" : colors.mutedForeground }]}>
            {done}/{total} recebidos
          </ThemedText>
        ) : undefined
      }
    >
      <View style={styles.list}>
        {documents.map((document) => (
          <View key={document.id} style={[styles.row, { borderColor: colors.border }]}>
            <View style={styles.headerRow}>
              <View style={styles.titleWrap}>
                <ThemedText style={[styles.title, { color: colors.foreground }]}>
                  {ADMISSION_DOCUMENT_TYPE_LABELS[document.type] ?? document.type}
                </ThemedText>
                {document.required && (
                  <Badge variant="outline" size="sm">
                    Obrigatório
                  </Badge>
                )}
              </View>
              <Badge variant={STATUS_BADGE[document.status] ?? "secondary"} size="sm">
                {ADMISSION_DOCUMENT_STATUS_LABELS[document.status] ?? document.status}
              </Badge>
            </View>
            {document.file ? (
              <ThemedText style={[styles.fileName, { color: colors.mutedForeground }]} numberOfLines={1}>
                {document.file.filename ?? document.file.originalName ?? "Arquivo anexado"}
              </ThemedText>
            ) : (
              <ThemedText style={[styles.muted, { color: colors.mutedForeground }]}>Nenhum arquivo anexado</ThemedText>
            )}
          </View>
        ))}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: { borderWidth: 1, borderRadius: 8, padding: spacing.md, gap: spacing.xs },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  titleWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  title: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  fileName: { fontSize: fontSize.sm },
  muted: { fontSize: fontSize.xs },
  progress: { fontSize: fontSize.sm },
});
