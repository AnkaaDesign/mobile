import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import {
  CHANGE_LOG_ACTION_LABELS,
  CHANGE_LOG_ENTITY_TYPE_LABELS,
  CHANGE_LOG_ACTION,
} from '../../../../constants';
import { formatDateTime } from '../../../../utils';
import type { ChangeLog } from '../../../../types';
import {
  IconFileText,
  IconPlus,
  IconEdit,
  IconTrash,
  IconArrowBackUp,
  IconArchive,
  IconCheck,
  IconX,
  IconRefresh,
} from "@tabler/icons-react-native";

interface ChangeLogCardProps {
  changeLog: ChangeLog;
}

export function ChangeLogCard({ changeLog }: ChangeLogCardProps) {
  const { colors } = useTheme();

  const getActionIcon = () => {
    const iconProps = { size: 18, color: colors.primary };

    switch (changeLog.action) {
      case CHANGE_LOG_ACTION.CREATE:
      case CHANGE_LOG_ACTION.BATCH_CREATE:
        return <IconPlus {...iconProps} />;
      case CHANGE_LOG_ACTION.UPDATE:
      case CHANGE_LOG_ACTION.BATCH_UPDATE:
        return <IconEdit {...iconProps} />;
      case CHANGE_LOG_ACTION.DELETE:
      case CHANGE_LOG_ACTION.BATCH_DELETE:
        return <IconTrash {...iconProps} />;
      case CHANGE_LOG_ACTION.RESTORE:
      case CHANGE_LOG_ACTION.ROLLBACK:
        return <IconArrowBackUp {...iconProps} />;
      case CHANGE_LOG_ACTION.ARCHIVE:
      case CHANGE_LOG_ACTION.UNARCHIVE:
        return <IconArchive {...iconProps} />;
      case CHANGE_LOG_ACTION.APPROVE:
      case CHANGE_LOG_ACTION.ACTIVATE:
      case CHANGE_LOG_ACTION.COMPLETE:
        return <IconCheck {...iconProps} />;
      case CHANGE_LOG_ACTION.REJECT:
      case CHANGE_LOG_ACTION.DEACTIVATE:
      case CHANGE_LOG_ACTION.CANCEL:
        return <IconX {...iconProps} />;
      case CHANGE_LOG_ACTION.RESCHEDULE:
        return <IconRefresh {...iconProps} />;
      default:
        return <IconFileText {...iconProps} />;
    }
  };

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
      case CHANGE_LOG_ACTION.RESCHEDULE:
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
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              {getActionIcon()}
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
              Informações do Registro
            </ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.infoContainer}>
          {/* Action */}
          <View style={styles.infoRow}>
            <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>
              Ação
            </ThemedText>
            <Badge variant={getActionColor()}>
              {CHANGE_LOG_ACTION_LABELS[changeLog.action]}
            </Badge>
          </View>

          {/* Entity Type */}
          <View style={styles.infoRow}>
            <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>
              Tipo de Entidade
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.value, { color: colors.foreground }])}>
              {CHANGE_LOG_ENTITY_TYPE_LABELS[changeLog.entityType]}
            </ThemedText>
          </View>

          {/* Entity ID */}
          <View style={styles.infoRow}>
            <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>
              ID da Entidade
            </ThemedText>
            <ThemedText
              style={StyleSheet.flatten([styles.value, styles.monoValue, { color: colors.foreground }])}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {changeLog.entityId}
            </ThemedText>
          </View>

          {/* Field Changed */}
          {changeLog.field && (
            <View style={styles.infoRow}>
              <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>
                Campo Alterado
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.value, styles.monoValue, { color: colors.foreground }])}>
                {changeLog.field}
              </ThemedText>
            </View>
          )}

          {/* Timestamp */}
          <View style={styles.infoRow}>
            <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>
              Data e Hora
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.value, { color: colors.foreground }])}>
              {formatDateTime(changeLog.createdAt)}
            </ThemedText>
          </View>

          {/* Reason */}
          {changeLog.reason && (
            <View style={styles.infoColumn}>
              <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>
                Motivo
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.value, { color: colors.foreground }])}>
                {changeLog.reason}
              </ThemedText>
            </View>
          )}

          {/* Metadata */}
          {changeLog.metadata && (
            <View style={styles.infoColumn}>
              <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>
                Metadados
              </ThemedText>
              <View
                style={StyleSheet.flatten([
                  styles.metadataBox,
                  { backgroundColor: colors.muted, borderColor: colors.border }
                ])}
              >
                <ThemedText
                  style={StyleSheet.flatten([styles.metadataText, { color: colors.foreground }])}
                >
                  {JSON.stringify(changeLog.metadata, null, 2)}
                </ThemedText>
              </View>
            </View>
          )}
        </View>
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
  infoContainer: {
    gap: spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  infoColumn: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: "right",
  },
  monoValue: {
    fontFamily: "monospace",
  },
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
