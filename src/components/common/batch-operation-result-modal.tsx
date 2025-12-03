import React, { useState, useMemo, useCallback } from "react";
import { View, ScrollView, StyleSheet, Pressable, Dimensions } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { IconCheck, IconX, IconAlertCircle, IconPackage, IconFileText } from "@tabler/icons-react-native";
import { Modal } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius, shadow, transitions } from "@/constants/design-system";
import type { BatchOperationResult, BatchOperationError } from "@/types/common";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

export interface BatchOperationResultModalProps<TSuccess = unknown, TFailed = unknown> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: BatchOperationResult<TSuccess, TFailed> | null;
  operationType: "create" | "update" | "delete";
  entityName: string;
  successItemDisplay?: (item: TSuccess, index: number) => React.ReactNode;
  failedItemDisplay?: (error: BatchOperationError<TFailed>, index: number) => React.ReactNode;
  onConfirm?: () => void;
}

type TabType = "success" | "failed";

/**
 * BatchOperationResultModal Component
 *
 * A modal component with fade effect for displaying detailed batch operation results.
 * Shows success/failure counts with tabs for viewing individual items.
 */
export function BatchOperationResultModal<TSuccess = unknown, TFailed = unknown>({
  open,
  onOpenChange,
  result,
  operationType,
  entityName,
  successItemDisplay,
  failedItemDisplay,
  onConfirm,
}: BatchOperationResultModalProps<TSuccess, TFailed>) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("success");

  // Memoize styles to prevent recalculation on every render
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Reset to appropriate tab when result changes
  React.useEffect(() => {
    if (result) {
      setActiveTab(result.totalFailed > 0 ? "failed" : "success");
    }
  }, [result]);

  const operationLabel = useMemo(() => ({
    create: "criado(s)",
    update: "atualizado(s)",
    delete: "excluido(s)",
  }[operationType]), [operationType]);

  // Memoize computed values
  const hasSuccesses = useMemo(() => result ? result.totalSuccess > 0 : false, [result]);
  const hasFailures = useMemo(() => result ? result.totalFailed > 0 : false, [result]);

  const handleClose = useCallback(() => {
    onConfirm?.();
    onOpenChange(false);
  }, [onConfirm, onOpenChange]);

  const handleTabPress = useCallback((tab: TabType, enabled: boolean) => {
    if (enabled) setActiveTab(tab);
  }, []);

  if (!result) return null;

  const getStatusIcon = () => {
    if (hasFailures && !hasSuccesses) {
      return <IconX size={24} color="#dc2626" />;
    }
    if (hasSuccesses && !hasFailures) {
      return <IconCheck size={24} color="#16a34a" />;
    }
    return <IconAlertCircle size={24} color="#d97706" />;
  };

  const getStatusTitle = () => {
    if (hasFailures && !hasSuccesses) {
      return "Falha na operacao em lote";
    }
    if (hasSuccesses && !hasFailures) {
      return "Operacao concluida";
    }
    return "Operacao parcialmente concluida";
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop with fade animation */}
        <Animated.View
          style={styles.backdrop}
          entering={FadeIn.duration(transitions.normal)}
          exiting={FadeOut.duration(transitions.fast)}
        />

        {/* Content container */}
        <View style={styles.contentContainer}>
          <Pressable style={styles.backdropPressable} onPress={handleClose} />

          <Animated.View
            entering={FadeIn.duration(transitions.normal).springify()}
            exiting={FadeOut.duration(transitions.fast)}
            style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitle}>
                {getStatusIcon()}
                <ThemedText style={styles.title}>{getStatusTitle()}</ThemedText>
              </View>
            </View>

            {/* Summary Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.statContent}>
                  <ThemedText style={[styles.statLabel, { color: colors.foreground }]}>Processado</ThemedText>
                  <ThemedText style={[styles.statValue, { color: colors.foreground }]}>{result.totalProcessed}</ThemedText>
                </View>
                <IconFileText size={24} color={colors.foreground} style={styles.statIcon} />
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.statContent}>
                  <ThemedText style={[styles.statLabel, { color: colors.foreground }]}>Sucesso</ThemedText>
                  <ThemedText style={[styles.statValue, { color: "#16a34a" }]}>{result.totalSuccess}</ThemedText>
                </View>
                <IconCheck size={24} color="#16a34a" style={styles.statIcon} />
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.statContent}>
                  <ThemedText style={[styles.statLabel, { color: colors.foreground }]}>Falha</ThemedText>
                  <ThemedText style={[styles.statValue, { color: "#dc2626" }]}>{result.totalFailed}</ThemedText>
                </View>
                <IconX size={24} color="#dc2626" style={styles.statIcon} />
              </View>
            </View>

            {/* Tabs */}
            <View style={[styles.tabsContainer, { backgroundColor: colors.muted }]}>
              <Pressable
                style={[
                  styles.tab,
                  activeTab === "success" && [styles.tabActive, { backgroundColor: colors.card }],
                  !hasSuccesses && styles.tabDisabled,
                ]}
                onPress={() => handleTabPress("success", hasSuccesses)}
                disabled={!hasSuccesses}
              >
                <IconCheck size={16} color={activeTab === "success" ? "#16a34a" : colors.mutedForeground} />
                <ThemedText
                  style={[
                    styles.tabText,
                    { color: activeTab === "success" ? colors.foreground : colors.mutedForeground },
                  ]}
                >
                  Sucesso ({result.totalSuccess})
                </ThemedText>
              </Pressable>

              <Pressable
                style={[
                  styles.tab,
                  activeTab === "failed" && [styles.tabActive, { backgroundColor: colors.card }],
                  !hasFailures && styles.tabDisabled,
                ]}
                onPress={() => handleTabPress("failed", hasFailures)}
                disabled={!hasFailures}
              >
                <IconX size={16} color={activeTab === "failed" ? "#dc2626" : colors.mutedForeground} />
                <ThemedText
                  style={[
                    styles.tabText,
                    { color: activeTab === "failed" ? colors.foreground : colors.mutedForeground },
                  ]}
                >
                  Falhas ({result.totalFailed})
                </ThemedText>
              </Pressable>
            </View>

            {/* Tab Content */}
            <ScrollView
              style={styles.tabContent}
              contentContainerStyle={styles.tabContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {activeTab === "success" && (
                <>
                  {result.success.length > 0 ? (
                    <View style={styles.itemsList}>
                      {result.success.map((item, index) => (
                        <View
                          key={index}
                          style={[styles.successItem, { backgroundColor: "rgba(22, 163, 74, 0.1)", borderColor: "rgba(22, 163, 74, 0.3)" }]}
                        >
                          <IconCheck size={16} color="#16a34a" style={styles.itemIcon} />
                          <View style={styles.itemContent}>
                            {successItemDisplay ? (
                              successItemDisplay(item, index)
                            ) : (
                              <ThemedText style={styles.itemText}>
                                Item {index + 1} {operationLabel} com sucesso
                              </ThemedText>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <IconPackage size={48} color={colors.mutedForeground} />
                      <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                        Nenhum item foi processado com sucesso
                      </ThemedText>
                    </View>
                  )}
                </>
              )}

              {activeTab === "failed" && (
                <>
                  {result.failed.length > 0 ? (
                    <View style={styles.itemsList}>
                      {result.failed.map((error, index) => (
                        <View
                          key={index}
                          style={[styles.failedItem, { backgroundColor: "rgba(220, 38, 38, 0.1)", borderColor: "rgba(220, 38, 38, 0.3)" }]}
                        >
                          <IconX size={16} color="#dc2626" style={styles.itemIcon} />
                          <View style={styles.itemContent}>
                            {failedItemDisplay ? (
                              failedItemDisplay(error, index)
                            ) : (
                              <View>
                                <ThemedText style={styles.itemTitle}>Item {error.index + 1}</ThemedText>
                                <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
                                  {error.error}
                                </ThemedText>
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <IconCheck size={48} color={colors.mutedForeground} />
                      <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                        Nenhuma falha ocorreu
                      </ThemedText>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <Button variant="outline" onPress={handleClose} style={styles.closeButton}>
                <Text>Fechar</Text>
              </Button>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
    backdropPressable: {
      ...StyleSheet.absoluteFillObject,
    },
    contentContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingVertical: 40,
    },
    modalContent: {
      width: screenWidth - 48,
      maxWidth: 500,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      overflow: "hidden",
      ...shadow.lg,
    },
    header: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: "600",
      flex: 1,
    },
    statsGrid: {
      flexDirection: "row",
      gap: spacing.xs,
      padding: spacing.sm,
    },
    statCard: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: spacing.xs,
      borderRadius: borderRadius.md,
      borderWidth: 1,
    },
    statContent: {
      gap: 2,
    },
    statLabel: {
      fontSize: 10,
    },
    statValue: {
      fontSize: fontSize.lg,
      fontWeight: "700",
    },
    statIcon: {
      opacity: 0.5,
    },
    tabsContainer: {
      flexDirection: "row",
      marginHorizontal: spacing.sm,
      borderRadius: borderRadius.md,
      padding: 3,
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.sm,
    },
    tabActive: {},
    tabDisabled: {
      opacity: 0.5,
    },
    tabText: {
      fontSize: fontSize.sm,
      fontWeight: "500",
    },
    tabContent: {
      maxHeight: screenHeight * 0.35,
    },
    tabContentContainer: {
      padding: spacing.sm,
    },
    itemsList: {
      gap: spacing.sm,
    },
    successItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
    },
    failedItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
    },
    itemIcon: {
      marginTop: 2,
      marginRight: spacing.sm,
    },
    itemContent: {
      flex: 1,
    },
    itemText: {
      fontSize: fontSize.sm,
    },
    itemTitle: {
      fontSize: fontSize.sm,
      fontWeight: "600",
      marginBottom: 4,
    },
    errorText: {
      fontSize: fontSize.sm,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.xl,
      gap: spacing.sm,
    },
    emptyText: {
      fontSize: fontSize.sm,
      textAlign: "center",
    },
    footer: {
      padding: spacing.sm,
      borderTopWidth: 1,
      alignItems: "flex-end",
    },
    closeButton: {
      minWidth: 100,
    },
  });
