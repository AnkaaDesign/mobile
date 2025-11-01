
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { extendedColors } from "@/lib/theme/extended-colors";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import type { ChangeLog } from '../../../../types';
import { IconArrowRight, IconMinus, IconPlus } from "@tabler/icons-react-native";

interface ChangesDiffCardProps {
  changeLog: ChangeLog;
}

export function ChangesDiffCard({ changeLog }: ChangesDiffCardProps) {
  const { colors, isDark } = useTheme();

  const hasOldValue = changeLog.oldValue !== null && changeLog.oldValue !== undefined;
  const hasNewValue = changeLog.newValue !== null && changeLog.newValue !== undefined;

  if (!hasOldValue && !hasNewValue) {
    return null;
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return "N/A";
    }

    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }

    if (typeof value === "boolean") {
      return value ? "Sim" : "Não";
    }

    if (typeof value === "number") {
      return value.toString();
    }

    return String(value);
  };

  const isMultiline = (value: any): boolean => {
    if (typeof value === "object") {
      return true;
    }
    const strValue = String(value);
    return strValue.length > 50 || strValue.includes("\n");
  };

  const showMultiline = isMultiline(changeLog.oldValue) || isMultiline(changeLog.newValue);

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconArrowRight size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
            Alterações
          </ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {showMultiline ? (
          // Vertical layout for multiline values
          <View style={styles.verticalDiff}>
            {/* Old Value */}
            {hasOldValue && (
              <View style={styles.diffSection}>
                <View style={styles.diffHeader}>
                  <View
                    style={[
                      styles.diffIcon,
                      {
                        backgroundColor: isDark
                          ? extendedColors.red[900] + "30"
                          : extendedColors.red[100],
                      },
                    ]}
                  >
                    <IconMinus size={14} color={extendedColors.red[600]} />
                  </View>
                  <ThemedText
                    style={[
                      styles.diffLabel,
                      { color: isDark ? extendedColors.red[400] : extendedColors.red[700] },
                    ]}
                  >
                    Valor Anterior
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.valueBox,
                    {
                      backgroundColor: isDark
                        ? extendedColors.red[900] + "20"
                        : extendedColors.red[50],
                      borderColor: isDark ? extendedColors.red[800] : extendedColors.red[200],
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.valueText,
                      { color: isDark ? extendedColors.red[300] : extendedColors.red[800] },
                    ]}
                  >
                    {formatValue(changeLog.oldValue)}
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Arrow Separator */}
            {hasOldValue && hasNewValue && (
              <View style={styles.arrowContainer}>
                <IconArrowRight size={24} color={colors.mutedForeground} />
              </View>
            )}

            {/* New Value */}
            {hasNewValue && (
              <View style={styles.diffSection}>
                <View style={styles.diffHeader}>
                  <View
                    style={[
                      styles.diffIcon,
                      {
                        backgroundColor: isDark
                          ? extendedColors.green[900] + "30"
                          : extendedColors.green[100],
                      },
                    ]}
                  >
                    <IconPlus size={14} color={extendedColors.green[600]} />
                  </View>
                  <ThemedText
                    style={[
                      styles.diffLabel,
                      { color: isDark ? extendedColors.green[400] : extendedColors.green[700] },
                    ]}
                  >
                    Novo Valor
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.valueBox,
                    {
                      backgroundColor: isDark
                        ? extendedColors.green[900] + "20"
                        : extendedColors.green[50],
                      borderColor: isDark ? extendedColors.green[800] : extendedColors.green[200],
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.valueText,
                      { color: isDark ? extendedColors.green[300] : extendedColors.green[800] },
                    ]}
                  >
                    {formatValue(changeLog.newValue)}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>
        ) : (
          // Horizontal layout for simple values
          <View style={styles.horizontalDiff}>
            {/* Old Value */}
            {hasOldValue && (
              <View style={styles.horizontalSection}>
                <View style={styles.diffHeader}>
                  <View
                    style={[
                      styles.diffIcon,
                      {
                        backgroundColor: isDark
                          ? extendedColors.red[900] + "30"
                          : extendedColors.red[100],
                      },
                    ]}
                  >
                    <IconMinus size={14} color={extendedColors.red[600]} />
                  </View>
                  <ThemedText
                    style={[
                      styles.diffLabel,
                      { color: isDark ? extendedColors.red[400] : extendedColors.red[700] },
                    ]}
                  >
                    Anterior
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.inlineValueBox,
                    {
                      backgroundColor: isDark
                        ? extendedColors.red[900] + "20"
                        : extendedColors.red[50],
                      borderColor: isDark ? extendedColors.red[800] : extendedColors.red[200],
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.inlineValueText,
                      { color: isDark ? extendedColors.red[300] : extendedColors.red[800] },
                    ]}
                    numberOfLines={2}
                  >
                    {formatValue(changeLog.oldValue)}
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Arrow */}
            {hasOldValue && hasNewValue && (
              <View style={styles.horizontalArrow}>
                <IconArrowRight size={20} color={colors.mutedForeground} />
              </View>
            )}

            {/* New Value */}
            {hasNewValue && (
              <View style={styles.horizontalSection}>
                <View style={styles.diffHeader}>
                  <View
                    style={[
                      styles.diffIcon,
                      {
                        backgroundColor: isDark
                          ? extendedColors.green[900] + "30"
                          : extendedColors.green[100],
                      },
                    ]}
                  >
                    <IconPlus size={14} color={extendedColors.green[600]} />
                  </View>
                  <ThemedText
                    style={[
                      styles.diffLabel,
                      { color: isDark ? extendedColors.green[400] : extendedColors.green[700] },
                    ]}
                  >
                    Novo
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.inlineValueBox,
                    {
                      backgroundColor: isDark
                        ? extendedColors.green[900] + "20"
                        : extendedColors.green[50],
                      borderColor: isDark ? extendedColors.green[800] : extendedColors.green[200],
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.inlineValueText,
                      { color: isDark ? extendedColors.green[300] : extendedColors.green[800] },
                    ]}
                    numberOfLines={2}
                  >
                    {formatValue(changeLog.newValue)}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    gap: spacing.md,
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
  verticalDiff: {
    gap: spacing.md,
  },
  horizontalDiff: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  diffSection: {
    gap: spacing.sm,
  },
  horizontalSection: {
    flex: 1,
    gap: spacing.sm,
  },
  diffHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  diffIcon: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  diffLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  valueBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  inlineValueBox: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  valueText: {
    fontSize: fontSize.sm,
    fontFamily: "monospace",
  },
  inlineValueText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  arrowContainer: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  horizontalArrow: {
    paddingTop: spacing.xl,
  },
});
