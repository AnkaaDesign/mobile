
import { View, StyleSheet } from "react-native";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import {
  CHANGE_LOG_ACTION_LABELS,
  CHANGE_LOG_ENTITY_TYPE_LABELS,
  CHANGE_LOG_ACTION,
} from "@/constants";
import { formatDateTime } from "@/utils";
import type { ChangeLog } from '../../../../types';
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";

interface ChangeLogCardProps {
  changeLog: ChangeLog;
}

export function ChangeLogCard({ changeLog }: ChangeLogCardProps) {
  const { colors } = useTheme();

  const getActionColor = (): "default" | "success" | "destructive" | "warning" | "info" => {
    switch (changeLog.action) {
      case CHANGE_LOG_ACTION.CREATE:
      case CHANGE_LOG_ACTION.BATCH_CREATE:
      case CHANGE_LOG_ACTION.APPROVE:
      case CHANGE_LOG_ACTION.ACTIVATE:
      case CHANGE_LOG_ACTION.COMPLETE:
        return "success";
      case CHANGE_LOG_ACTION.DELETE:
      case CHANGE_LOG_ACTION.BATCH_DELETE:
      case CHANGE_LOG_ACTION.REJECT:
      case CHANGE_LOG_ACTION.DEACTIVATE:
      case CHANGE_LOG_ACTION.CANCEL:
        return "destructive";
      case CHANGE_LOG_ACTION.UPDATE:
      case CHANGE_LOG_ACTION.BATCH_UPDATE:
        return "info";
      case CHANGE_LOG_ACTION.RESTORE:
      case CHANGE_LOG_ACTION.ROLLBACK:
      case CHANGE_LOG_ACTION.ARCHIVE:
      case CHANGE_LOG_ACTION.UNARCHIVE:
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <DetailCard title="Informações do Registro" icon="file-text">
      {/* Action */}
      <DetailField
        label="Ação"
        icon="settings"
        value={
          <Badge variant={getActionColor()}>
            {CHANGE_LOG_ACTION_LABELS[changeLog.action]}
          </Badge>
        }
      />

      {/* Entity Type */}
      <DetailField
        label="Tipo de Entidade"
        icon="database"
        value={CHANGE_LOG_ENTITY_TYPE_LABELS[changeLog.entityType]}
      />

      {/* Entity ID */}
      <DetailField
        label="ID da Entidade"
        icon="hash"
        value={changeLog.entityId}
        monospace
      />

      {/* Field Changed */}
      {changeLog.field && (
        <DetailField
          label="Campo Alterado"
          icon="edit"
          value={changeLog.field}
          monospace
        />
      )}

      {/* Timestamp */}
      <DetailField
        label="Data e Hora"
        icon="clock"
        value={formatDateTime(changeLog.createdAt)}
      />

      {/* Reason */}
      {changeLog.reason && (
        <DetailField
          label="Motivo"
          icon="message-circle"
          value={changeLog.reason}
        />
      )}

      {/* Metadata */}
      {changeLog.metadata && (
        <DetailField
          label="Metadados"
          icon="code"
          value={
            <View
              style={[
                styles.metadataBox,
                { backgroundColor: colors.muted, borderColor: colors.border }
              ]}
            >
              <ThemedText
                style={[styles.metadataText, { color: colors.foreground }]}
              >
                {JSON.stringify(changeLog.metadata, null, 2)}
              </ThemedText>
            </View>
          }
        />
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  metadataBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  metadataText: {
    fontSize: fontSize.xs,
    fontFamily: "monospace",
  },
});
