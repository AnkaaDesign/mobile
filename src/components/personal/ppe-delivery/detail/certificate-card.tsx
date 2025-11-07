import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import type { Item } from "@/types";
import { formatDate } from "@/utils";

interface CertificateCardProps {
  item?: Item;
}

export function CertificateCard({ item }: CertificateCardProps) {
  const { colors } = useTheme();

  const hasCA = item?.ppeCA;
  const hasExpiration = item?.expirationDate;

  if (!hasCA && !hasExpiration) {
    return null; // Don't render if no certificate info
  }

  const isExpired = hasExpiration ? new Date(item.expirationDate!) < new Date() : false;
  const isExpiringSoon = hasExpiration && !isExpired
    ? new Date(item.expirationDate!).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000 // 30 days
    : false;

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Icon name="certificate" size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Certificado de Aprovação (CA)</ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        {/* CA Number */}
        {hasCA && (
          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.fieldLabelWithIcon}>
              <Icon name="file-certificate" size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Número do CA</ThemedText>
            </View>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>{item.ppeCA}</ThemedText>
          </View>
        )}

        {/* Expiration Date */}
        {hasExpiration && (
          <View style={[styles.fieldRow, { backgroundColor: colors.background }]}>
            <View style={styles.fieldLabelWithIcon}>
              <Icon name="calendar" size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Validade</ThemedText>
            </View>
            <View style={styles.expirationContainer}>
              <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
                {formatDate(new Date(item.expirationDate!))}
              </ThemedText>
              {isExpired && (
                <Badge variant="destructive" size="sm">
                  <ThemedText style={styles.badgeText}>Vencido</ThemedText>
                </Badge>
              )}
              {isExpiringSoon && !isExpired && (
                <Badge variant="warning" size="sm">
                  <ThemedText style={styles.badgeText}>Expira em breve</ThemedText>
                </Badge>
              )}
            </View>
          </View>
        )}

        {/* Warning for expired certificate */}
        {isExpired && (
          <View style={[styles.warningBox, { backgroundColor: colors.destructive + "20", borderColor: colors.destructive }]}>
            <Icon name="alert-triangle" size={16} color={colors.destructive} />
            <ThemedText style={[styles.warningText, { color: colors.destructive }]}>
              Certificado vencido. Este EPI não deve ser utilizado.
            </ThemedText>
          </View>
        )}

        {/* Warning for expiring soon */}
        {isExpiringSoon && !isExpired && (
          <View style={[styles.warningBox, { backgroundColor: colors.warning + "20", borderColor: colors.warning }]}>
            <Icon name="alert-circle" size={16} color={colors.warning} />
            <ThemedText style={[styles.warningText, { color: colors.warning }]}>
              Certificado próximo do vencimento. Solicite substituição.
            </ThemedText>
          </View>
        )}

        {/* Valid certificate indicator */}
        {!isExpired && !isExpiringSoon && hasExpiration && (
          <View style={[styles.successBox, { backgroundColor: colors.success + "20", borderColor: colors.success }]}>
            <Icon name="check-circle" size={16} color={colors.success} />
            <ThemedText style={[styles.successText, { color: colors.success }]}>
              Certificado válido
            </ThemedText>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    gap: spacing.xs,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  fieldLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
  },
  fieldValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  expirationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  warningText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  successText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
});
