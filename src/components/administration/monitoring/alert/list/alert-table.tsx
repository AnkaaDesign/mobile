import React, { useCallback } from "react";
import { FlatList, View, Pressable, RefreshControl, StyleSheet, Alert as AlertDialog } from "react-native";
import { IconAlertTriangle, IconAlertCircle, IconInfoCircle, IconClock, IconCheck, IconBell, IconX } from "@tabler/icons-react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { formatRelativeTime } from '../../../../../utils';
import { NOTIFICATION_IMPORTANCE } from '../../../../../constants';
import { ReanimatedSwipeableRow, type SwipeAction, type Swipeable } from "@/components/ui/reanimated-swipeable-row";

const ACTION_WIDTH = 80;

export interface AlertItem {
  id: string;
  type: string;
  severity: NOTIFICATION_IMPORTANCE;
  title: string;
  description: string;
  timestamp: Date;
  source: string;
  acknowledged: boolean;
  resolved: boolean;
}

interface AlertTableProps {
  alerts: AlertItem[];
  onAlertPress?: (alertId: string) => void;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  loading?: boolean;
  onEndReached?: () => void;
  loadingMore?: boolean;
}

export function AlertTable({
  alerts,
  onAlertPress,
  onAcknowledge,
  onResolve,
  onDismiss,
  onRefresh,
  refreshing = false,
  loading = false,
  onEndReached,
  loadingMore = false,
}: AlertTableProps) {
  const { colors } = useTheme();

  const getSeverityColor = useCallback((severity: NOTIFICATION_IMPORTANCE) => {
    switch (severity) {
      case NOTIFICATION_IMPORTANCE.URGENT:
        return colors.destructive;
      case NOTIFICATION_IMPORTANCE.HIGH:
        return colors.warning;
      case NOTIFICATION_IMPORTANCE.NORMAL:
        return colors.primary;
      case NOTIFICATION_IMPORTANCE.LOW:
        return colors.muted;
      default:
        return colors.muted;
    }
  }, [colors]);

  const getSeverityIcon = useCallback((severity: NOTIFICATION_IMPORTANCE, size: number = 20) => {
    const color = getSeverityColor(severity);
    switch (severity) {
      case NOTIFICATION_IMPORTANCE.URGENT:
      case NOTIFICATION_IMPORTANCE.HIGH:
        return <IconAlertTriangle size={size} color={color} />;
      case NOTIFICATION_IMPORTANCE.NORMAL:
        return <IconAlertCircle size={size} color={color} />;
      case NOTIFICATION_IMPORTANCE.LOW:
        return <IconInfoCircle size={size} color={color} />;
      default:
        return <IconInfoCircle size={size} color={color} />;
    }
  }, [getSeverityColor]);

  const getSeverityLabel = useCallback((severity: NOTIFICATION_IMPORTANCE) => {
    switch (severity) {
      case NOTIFICATION_IMPORTANCE.URGENT:
        return "Urgente";
      case NOTIFICATION_IMPORTANCE.HIGH:
        return "Alta";
      case NOTIFICATION_IMPORTANCE.NORMAL:
        return "Normal";
      case NOTIFICATION_IMPORTANCE.LOW:
        return "Baixa";
      default:
        return "Normal";
    }
  }, []);

  const handleAcknowledge = useCallback((alertId: string, alertTitle: string) => {
    AlertDialog.alert(
      "Confirmar Reconhecimento",
      `Deseja marcar o alerta "${alertTitle}" como reconhecido?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Reconhecer",
          style: "default",
          onPress: () => onAcknowledge?.(alertId),
        },
      ]
    );
  }, [onAcknowledge]);

  const handleResolve = useCallback((alertId: string, alertTitle: string) => {
    AlertDialog.alert(
      "Confirmar Resolução",
      `Deseja marcar o alerta "${alertTitle}" como resolvido?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Resolver",
          style: "default",
          onPress: () => onResolve?.(alertId),
        },
      ]
    );
  }, [onResolve]);

  const handleDismiss = useCallback((alertId: string, alertTitle: string) => {
    AlertDialog.alert(
      "Confirmar Descarte",
      `Deseja descartar o alerta "${alertTitle}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => onDismiss?.(alertId),
        },
      ]
    );
  }, [onDismiss]);

  const renderAlert = useCallback(({ item: alert }: { item: AlertItem }) => {
    const severityColor = getSeverityColor(alert.severity);

    // Build swipe actions
    const rightActions: SwipeAction[] = [];

    if (!alert.acknowledged && onAcknowledge) {
      rightActions.push({
        key: "acknowledge",
        label: "Reconhecer",
        icon: <IconBell size={20} color="white" />,
        backgroundColor: colors.primary,
        onPress: () => handleAcknowledge(alert.id, alert.title),
        closeOnPress: true,
      });
    }

    if (!alert.resolved && onResolve) {
      rightActions.push({
        key: "resolve",
        label: "Resolver",
        icon: <IconCheck size={20} color="white" />,
        backgroundColor: colors.success,
        onPress: () => handleResolve(alert.id, alert.title),
        closeOnPress: true,
      });
    }

    if (onDismiss) {
      rightActions.push({
        key: "dismiss",
        label: "Descartar",
        icon: <IconX size={20} color="white" />,
        backgroundColor: colors.destructive,
        onPress: () => handleDismiss(alert.id, alert.title),
        closeOnPress: false,
      });
    }

    const alertContent = (
      <Pressable
        onPress={() => onAlertPress?.(alert.id)}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Card
          style={[
            styles.alertCard,
            {
              backgroundColor: colors.card,
              borderColor: alert.resolved ? colors.muted : severityColor,
              borderLeftWidth: 4,
              opacity: alert.resolved ? 0.7 : 1,
            },
          ]}
        >
          <View style={styles.alertHeader}>
            <View style={styles.alertTitleContainer}>
              {getSeverityIcon(alert.severity)}
              <View style={styles.alertTitleText}>
                <ThemedText style={styles.alertTitle} numberOfLines={2}>
                  {alert.title}
                </ThemedText>
                <ThemedText style={styles.alertSource}>{alert.source}</ThemedText>
              </View>
            </View>

            <View style={styles.alertBadges}>
              {alert.acknowledged && (
                <Badge style={{ backgroundColor: colors.success }}>
                  <IconCheck size={12} color="white" />
                </Badge>
              )}
              {alert.resolved && (
                <Badge style={{ backgroundColor: colors.muted }}>
                  <ThemedText style={[styles.badgeText, { color: "white" }]}>
                    Resolvido
                  </ThemedText>
                </Badge>
              )}
              {!alert.resolved && (
                <Badge style={{ backgroundColor: severityColor }}>
                  <ThemedText style={[styles.badgeText, { color: "white" }]}>
                    {getSeverityLabel(alert.severity)}
                  </ThemedText>
                </Badge>
              )}
            </View>
          </View>

          <ThemedText style={styles.alertDescription} numberOfLines={2}>
            {alert.description}
          </ThemedText>

          <View style={styles.alertFooter}>
            <View style={styles.alertTime}>
              <IconClock size={16} color={colors.muted} />
              <ThemedText style={styles.alertTimestamp}>
                {formatRelativeTime(alert.timestamp)}
              </ThemedText>
            </View>
          </View>
        </Card>
      </Pressable>
    );

    if (rightActions.length === 0) {
      return alertContent;
    }

    return (
      <ReanimatedSwipeableRow
        rightActions={rightActions}
        enabled={true}
        friction={2}
        rightThreshold={40}
        overshootRight={false}
        containerStyle={styles.swipeContainer}
        actionWidth={ACTION_WIDTH}
      >
        {alertContent}
      </ReanimatedSwipeableRow>
    );
  }, [
    colors,
    getSeverityColor,
    getSeverityIcon,
    getSeverityLabel,
    onAlertPress,
    onAcknowledge,
    onResolve,
    onDismiss,
    handleAcknowledge,
    handleResolve,
    handleDismiss,
  ]);

  return (
    <FlatList
      data={alerts}
      renderItem={renderAlert}
      keyExtractor={(item) => item.id}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  separator: {
    height: 12,
  },
  swipeContainer: {
    overflow: "hidden",
  },
  alertCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  alertTitleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  alertTitleText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  alertSource: {
    fontSize: 12,
    opacity: 0.7,
    fontWeight: "500",
  },
  alertBadges: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  alertDescription: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 12,
    lineHeight: 20,
  },
  alertFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  alertTimestamp: {
    fontSize: 12,
    opacity: 0.6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
