import React, { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, Pressable, StyleSheet, Alert } from "react-native";
import { IconChevronDown, IconChevronRight, IconCopy, IconAlertCircle, IconInfoCircle, IconAlertTriangle, IconBug } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText, ThemedView, Badge, Card } from "@/components/ui";
import { ReanimatedSwipeableRow } from "@/components/ui/reanimated-swipeable-row";
import { InfiniteScrollFooter } from "@/components/ui/infinite-scroll-footer";
import { formatDate, formatTime } from '../../../../../utils';
import * as Clipboard from "expo-clipboard";

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: "error" | "warning" | "info" | "debug";
  message: string;
  source: string;
  details?: string;
  stack?: string;
}

interface LogTableProps {
  logs: LogEntry[];
  onRefresh?: () => void;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
}

export function LogTable({ logs, onRefresh, onEndReached, refreshing = false, loading = false, loadingMore = false }: LogTableProps) {
  const { colors } = useTheme();
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((logId: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  }, []);

  const getLevelIcon = (level: string, size: number = 16) => {
    switch (level) {
      case "error":
        return <IconAlertCircle size={size} color={colors.destructive} />;
      case "warning":
        return <IconAlertTriangle size={size} color={colors.warning} />;
      case "debug":
        return <IconBug size={size} color={colors.muted} />;
      default:
        return <IconInfoCircle size={size} color={colors.primary} />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return colors.destructive;
      case "warning":
        return colors.warning;
      case "debug":
        return colors.muted;
      default:
        return colors.primary;
    }
  };

  const getLevelBgColor = (level: string) => {
    switch (level) {
      case "error":
        return `${colors.destructive}15`;
      case "warning":
        return `${colors.warning}15`;
      case "debug":
        return `${colors.muted}15`;
      default:
        return `${colors.primary}15`;
    }
  };

  const handleCopyLog = useCallback(
    async (log: LogEntry) => {
      const logText = `[${formatDate(log.timestamp)} ${formatTime(log.timestamp)}] [${log.level.toUpperCase()}] ${log.source}\n${log.message}${log.details ? `\n\nDetails:\n${log.details}` : ""}${log.stack ? `\n\nStack:\n${log.stack}` : ""}`;
      await Clipboard.setStringAsync(logText);
      Alert.alert("Copiado", "Log copiado para a área de transferência");
    },
    [],
  );

  const handleViewDetails = useCallback((log: LogEntry) => {
    toggleExpanded(log.id);
  }, [toggleExpanded]);

  const renderSwipeActions = useCallback(
    (log: LogEntry) => {
      const actions = [
        {
          label: expandedLogs.has(log.id) ? "Recolher" : "Ver Detalhes",
          onPress: () => handleViewDetails(log),
          backgroundColor: colors.primary,
          icon: expandedLogs.has(log.id) ? "chevron-up" : "chevron-down",
        },
        {
          label: "Copiar",
          onPress: () => handleCopyLog(log),
          backgroundColor: colors.muted,
          icon: "copy",
        },
      ];
      return actions;
    },
    [expandedLogs, colors, handleViewDetails, handleCopyLog],
  );

  const renderLogRow = (log: LogEntry) => {
    const isExpanded = expandedLogs.has(log.id);

    const content = (
      <Pressable onPress={() => toggleExpanded(log.id)} style={[styles.logCard, { backgroundColor: colors.card, borderLeftColor: getLevelColor(log.level) }]}>
        {/* Header */}
        <View style={styles.logHeader}>
          <View style={styles.logHeaderLeft}>
            {getLevelIcon(log.level, 18)}
            <Badge style={{ backgroundColor: getLevelColor(log.level), paddingHorizontal: 8, paddingVertical: 2 }}>
              <ThemedText style={StyleSheet.flatten([styles.levelBadgeText, { color: "white" }])}>{log.level.toUpperCase()}</ThemedText>
            </Badge>
          </View>

          <View style={styles.logHeaderRight}>
            <ThemedText style={styles.logTime}>{formatTime(log.timestamp)}</ThemedText>
            <ThemedText style={styles.logDate}>{formatDate(log.timestamp)}</ThemedText>
          </View>
        </View>

        {/* Source */}
        <View style={[styles.sourceContainer, { backgroundColor: getLevelBgColor(log.level) }]}>
          <ThemedText style={styles.sourceText} numberOfLines={1}>
            {log.source}
          </ThemedText>
        </View>

        {/* Message */}
        <ThemedText style={styles.logMessage} numberOfLines={isExpanded ? undefined : 3}>
          {log.message}
        </ThemedText>

        {/* Expanded Details */}
        {isExpanded && (log.details || log.stack) && (
          <View style={[styles.expandedContent, { backgroundColor: colors.muted, borderTopColor: colors.border }]}>
            {log.details && (
              <View style={styles.detailsSection}>
                <ThemedText style={styles.detailsLabel}>Detalhes:</ThemedText>
                <ThemedText style={styles.detailsText} selectable>
                  {log.details}
                </ThemedText>
              </View>
            )}

            {log.stack && (
              <View style={styles.detailsSection}>
                <ThemedText style={styles.detailsLabel}>Stack Trace:</ThemedText>
                <ScrollView horizontal style={styles.stackScroll}>
                  <ThemedText style={styles.stackText} selectable>
                    {log.stack}
                  </ThemedText>
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Expand Indicator */}
        <View style={styles.expandIndicator}>
          {isExpanded ? <IconChevronDown size={16} color={colors.mutedForeground} /> : <IconChevronRight size={16} color={colors.mutedForeground} />}
        </View>
      </Pressable>
    );

    return (
      <View key={log.id} style={styles.logRowContainer}>
        <ReanimatedSwipeableRow
          actions={renderSwipeActions(log)}
          friction={2}
          overshootFriction={8}
          renderContent={() => content}
        />
      </View>
    );
  };

  const handleScroll = useCallback(
    ({ nativeEvent }: any) => {
      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
      const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;

      if (isCloseToBottom && onEndReached && !loadingMore) {
        onEndReached();
      }
    },
    [onEndReached, loadingMore],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      onScroll={handleScroll}
      scrollEventThrottle={400}
      showsVerticalScrollIndicator={false}
    >
      {logs.map(renderLogRow)}

      <InfiniteScrollFooter hasMore={!!onEndReached} isLoading={loadingMore} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 12,
  },
  logRowContainer: {
    marginBottom: 8,
  },
  logCard: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  logHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  logHeaderRight: {
    alignItems: "flex-end",
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  logTime: {
    fontSize: 14,
    fontWeight: "600",
  },
  logDate: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 2,
  },
  sourceContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: "500",
    opacity: 0.8,
  },
  logMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderRadius: 4,
    padding: 8,
  },
  detailsSection: {
    marginBottom: 8,
  },
  detailsLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    opacity: 0.8,
  },
  detailsText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "monospace",
  },
  stackScroll: {
    maxHeight: 200,
  },
  stackText: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: "monospace",
  },
  expandIndicator: {
    position: "absolute",
    right: 8,
    bottom: 8,
  },
});
