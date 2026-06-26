import { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { useFileViewer } from "@/components/file";
import type { Termination, TerminationDocument } from "@/types";
import { TERMINATION_DOCUMENT_STATUS } from "@/constants";
import {
  TERMINATION_DOCUMENT_TYPE_LABELS,
  TERMINATION_DOCUMENT_STATUS_LABELS,
} from "@/constants/enum-labels";
import { useTerminationDocumentUpdate } from "@/hooks/useTermination";

interface Props {
  termination: Termination;
  /** True when the termination is COMPLETED/CANCELLED — blocks every mutation. */
  canManage?: boolean;
}

function statusVariant(status: TERMINATION_DOCUMENT_STATUS): any {
  switch (status) {
    case TERMINATION_DOCUMENT_STATUS.DELIVERED:
      return "delivered";
    case TERMINATION_DOCUMENT_STATUS.SIGNED:
      return "purple";
    case TERMINATION_DOCUMENT_STATUS.GENERATED:
      return "primary";
    default:
      return "pending";
  }
}

export function TerminationDocumentsCard({ termination: t, canManage }: Props) {
  const { colors } = useTheme();
  const fileViewer = useFileViewer();
  const updateDocument = useTerminationDocumentUpdate();
  const [busyId, setBusyId] = useState<string | null>(null);

  const documents = (t.documents ?? []) as TerminationDocument[];

  const handleStatusChange = (doc: TerminationDocument) => {
    if (!canManage) return;
    const options = Object.values(TERMINATION_DOCUMENT_STATUS).filter(
      (s) => s !== doc.status,
    );
    Alert.alert(
      "Alterar Status",
      `${TERMINATION_DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type}`,
      [
        ...options.map((status) => ({
          text: TERMINATION_DOCUMENT_STATUS_LABELS[status],
          onPress: async () => {
            try {
              setBusyId(doc.id);
              await updateDocument.mutateAsync({
                documentId: doc.id,
                data: { status },
              });
            } catch {
              /* interceptor toasts */
            } finally {
              setBusyId(null);
            }
          },
        })),
        { text: "Cancelar", style: "cancel" as const },
      ],
    );
  };

  return (
    <DetailCard
      title="Documentos"
      icon="file-text"
      badge={documents.length > 0 ? <Badge variant="secondary">{String(documents.length)}</Badge> : undefined}
    >
      <View style={styles.content}>
        {documents.length > 0 ? (
          <ThemedText style={{ color: colors.mutedForeground, fontSize: 12 }}>
            O TRCT, a carta de aviso, o termo 484-A e o termo de homologação são gerados
            automaticamente em PDF ao entrar na etapa de Homologação.
          </ThemedText>
        ) : null}

        {documents.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="file-text" size={28} color={colors.mutedForeground} />
            <ThemedText style={{ color: colors.foreground, fontWeight: "600" }}>
              Nenhum documento
            </ThemedText>
            <ThemedText style={{ color: colors.mutedForeground, fontSize: 12, textAlign: "center" }}>
              O checklist de documentos é criado automaticamente ao cadastrar a rescisão.
            </ThemedText>
          </View>
        ) : (
          documents.map((doc) => (
            <View key={doc.id} style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={styles.info}>
                <ThemedText style={{ color: colors.foreground, fontWeight: "500" }}>
                  {TERMINATION_DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type}
                </ThemedText>
                {doc.note ? (
                  <ThemedText style={{ color: colors.mutedForeground, fontSize: 12 }}>
                    {doc.note}
                  </ThemedText>
                ) : null}
                {doc.file ? (
                  <TouchableOpacity
                    onPress={() => fileViewer.actions.viewFile(doc.file!)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <ThemedText
                      style={{ color: colors.primary, fontSize: 12 }}
                      numberOfLines={1}
                    >
                      {doc.file.filename}
                    </ThemedText>
                  </TouchableOpacity>
                ) : (
                  <ThemedText style={{ color: colors.mutedForeground, fontSize: 12 }}>
                    Sem arquivo
                  </ThemedText>
                )}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  disabled={!canManage || busyId === doc.id}
                  onPress={() => handleStatusChange(doc)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Badge variant={statusVariant(doc.status)}>
                    {TERMINATION_DOCUMENT_STATUS_LABELS[doc.status] ?? doc.status}
                  </Badge>
                </TouchableOpacity>
                {doc.file ? (
                  <TouchableOpacity
                    onPress={() => fileViewer.actions.downloadFile(doc.file!)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    accessibilityRole="button"
                    accessibilityLabel="Baixar documento"
                  >
                    <Icon name="download" size={18} color={colors.foreground} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))
        )}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12 },
  empty: { alignItems: "center", gap: 6, paddingVertical: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: { flex: 1, gap: 2 },
  actions: { flexDirection: "row", alignItems: "center", gap: 12 },
});
