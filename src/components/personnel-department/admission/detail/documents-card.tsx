// documents-card.tsx (mobile) — "Checklist de Documentos".
// Mirrors web: lists the admission document checklist with status badges, file
// attach/replace, and the in-app LGPD signing flow for the LGPD_TERM row.

import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { IconWriting, IconShieldCheck } from "@tabler/icons-react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";
import { FilePicker, type FilePickerItem } from "@/components/ui/file-picker";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import {
  ADMISSION_DOCUMENT_STATUS,
  ADMISSION_DOCUMENT_STATUS_LABELS,
  ADMISSION_DOCUMENT_TYPE,
  ADMISSION_DOCUMENT_TYPE_LABELS,
} from "@/constants";
import { formatDateTime } from "@/utils/date";
import { useAdmissionDocumentUpload } from "@/hooks/useAdmission";
import type { Admission, AdmissionDocument } from "@/types/admission";
import { getDocumentProgress, getAdmissionChecklistDocuments } from "../utils";
import { SignLgpdButton } from "./sign-lgpd-button";

interface DocumentsCardProps {
  admission: Admission;
}

const DOCUMENT_STATUS_BADGE: Record<string, BadgeProps["variant"]> = {
  [ADMISSION_DOCUMENT_STATUS.PENDING]: "pending",
  [ADMISSION_DOCUMENT_STATUS.RECEIVED]: "received",
  [ADMISSION_DOCUMENT_STATUS.SIGNED]: "completed",
  [ADMISSION_DOCUMENT_STATUS.WAIVED]: "secondary",
};

function isDocumentSigned(document: AdmissionDocument): boolean {
  return document.status === ADMISSION_DOCUMENT_STATUS.SIGNED || !!document.signedAt || !!document.signedFileId;
}

function DocumentRow({ admissionId, document }: { admissionId: string; document: AdmissionDocument }) {
  const { colors } = useTheme();
  const uploadMutation = useAdmissionDocumentUpload();
  const [busy, setBusy] = useState(false);

  const typeLabel = ADMISSION_DOCUMENT_TYPE_LABELS[document.type as ADMISSION_DOCUMENT_TYPE] || document.type;
  const isLgpd = document.type === ADMISSION_DOCUMENT_TYPE.LGPD_TERM;

  const handleFile = async (files: FilePickerItem[]) => {
    const picked = files[0];
    if (!picked) return;
    setBusy(true);
    try {
      await uploadMutation.mutateAsync({
        id: admissionId,
        data: { type: document.type },
        file: { uri: picked.uri, name: picked.name, type: picked.mimeType || picked.type || "application/octet-stream" },
      });
    } catch {
      // toast handled by axios interceptor
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <View style={styles.rowHeader}>
        <View style={styles.rowTitleWrap}>
          <ThemedText style={styles.rowTitle}>{typeLabel}</ThemedText>
          {document.required && (
            <Badge variant="outline" size="sm">Obrigatório</Badge>
          )}
        </View>
        <Badge variant={DOCUMENT_STATUS_BADGE[document.status] || "secondary"} size="sm">
          {ADMISSION_DOCUMENT_STATUS_LABELS[document.status] || document.status}
        </Badge>
      </View>

      {document.file ? (
        <ThemedText style={[styles.fileName, { color: colors.foreground }]} numberOfLines={1}>
          {document.file.filename || document.file.originalName || "Arquivo anexado"}
        </ThemedText>
      ) : (
        <ThemedText style={[styles.muted, { color: colors.mutedForeground }]}>Nenhum arquivo anexado</ThemedText>
      )}

      {document.note ? <ThemedText style={[styles.muted, { color: colors.mutedForeground }]}>{document.note}</ThemedText> : null}

      {/* Signature evidence (read-only) when signed in-app */}
      {isDocumentSigned(document) && (
        <View style={[styles.signedBox, { borderColor: "#16a34a", backgroundColor: colors.muted }]}>
          <View style={styles.signedRow}>
            <IconWriting size={16} color="#16a34a" />
            <ThemedText style={[styles.signedText, { color: "#16a34a" }]}>
              Assinado
              {document.signedAt ? ` em ${formatDateTime(document.signedAt)}` : ""}
              {document.signedBy?.name ? ` por ${document.signedBy.name}` : ""}
            </ThemedText>
          </View>
          {document.padesSealed && (
            <View style={styles.signedRow}>
              <IconShieldCheck size={14} color={colors.mutedForeground} />
              <ThemedText style={[styles.padesText, { color: colors.mutedForeground }]}>Selo PAdES (ICP-Brasil)</ThemedText>
            </View>
          )}
        </View>
      )}

      {/* Attach / replace file */}
      <FilePicker
        value={[]}
        onChange={handleFile}
        maxFiles={1}
        disabled={busy}
        placeholder={document.fileId ? "Substituir arquivo" : "Anexar arquivo"}
      />

      {/* In-app LGPD signature flow for the Termo LGPD row */}
      {isLgpd && (
        <View style={styles.signSlot}>
          <SignLgpdButton document={document} />
        </View>
      )}
    </View>
  );
}

export function DocumentsCard({ admission }: DocumentsCardProps) {
  const { colors } = useTheme();
  // Only the admission checklist document types (legacy extras are excluded).
  const documents = getAdmissionChecklistDocuments(admission.documents);
  const { done, total } = getDocumentProgress(admission.documents);

  return (
    <DetailCard
      title="Checklist de Documentos"
      icon="file-text"
      badge={
        total > 0 ? (
          <ThemedText style={[styles.progress, { color: done === total ? "#16a34a" : colors.mutedForeground }]}>
            {done}/{total} documentos recebidos
          </ThemedText>
        ) : undefined
      }
    >
      {documents.length === 0 ? (
        <ThemedText style={[styles.muted, { color: colors.mutedForeground, textAlign: "center" }]}>
          Nenhum documento no checklist desta admissão.
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {documents.map((document) => (
            <DocumentRow key={document.id} admissionId={admission.id} document={document} />
          ))}
        </View>
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: { borderWidth: 1, borderRadius: 8, padding: spacing.md, gap: spacing.xs },
  rowHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  rowTitleWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  rowTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  fileName: { fontSize: fontSize.sm },
  muted: { fontSize: fontSize.xs },
  progress: { fontSize: fontSize.sm },
  signedBox: { borderWidth: 1, borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, gap: 4 },
  signedRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  signedText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, flex: 1 },
  padesText: { fontSize: fontSize.xs },
  signSlot: { marginTop: spacing.sm },
});
