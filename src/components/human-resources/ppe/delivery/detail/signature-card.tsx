import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconSignature, IconCalendar, IconCircleCheck, IconCircleX } from "@tabler/icons-react-native";
import { formatDate } from '../../../../../utils';
import type { PpeDelivery } from '../../../../../types';

interface SignatureCardProps {
  delivery: PpeDelivery;
}

export function SignatureCard({ delivery }: SignatureCardProps) {
  const { colors } = useTheme();
  const isSigned = delivery.status === "DELIVERED";

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
            <IconSignature size={18} color={colors.primary} />
          </View>
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>Assinatura</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Status da Assinatura</ThemedText>
            <Badge variant={isSigned ? "success" : "secondary"}>
              <View style={styles.badgeContent}>
                {isSigned ? <IconCircleCheck size={14} color="white" /> : <IconCircleX size={14} color={colors.mutedForeground} />}
                <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: isSigned ? "white" : colors.mutedForeground }])}>
                  {isSigned ? "Assinado" : "Não Assinado"}
                </ThemedText>
              </View>
            </Badge>
          </View>

          {isSigned && delivery.actualDeliveryDate && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <IconCalendar size={16} color={colors.mutedForeground} style={styles.infoIcon} />
                <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Data da Assinatura</ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>{formatDate(new Date(delivery.actualDeliveryDate))}</ThemedText>
            </View>
          )}

          {delivery.reviewedByUser && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <IconSignature size={16} color={colors.mutedForeground} style={styles.infoIcon} />
                <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Revisado por</ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])} numberOfLines={1}>
                {delivery.reviewedByUser.name}
              </ThemedText>
            </View>
          )}

          {!isSigned && (
            <View style={StyleSheet.flatten([styles.messageContainer, { backgroundColor: colors.muted }])}>
              <ThemedText style={StyleSheet.flatten([styles.messageText, { color: colors.mutedForeground }])}>
                Esta entrega ainda não foi assinada pelo funcionário.
              </ThemedText>
            </View>
          )}
        </View>
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
  content: {
    gap: spacing.md,
  },
  infoContainer: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    maxWidth: "50%",
    textAlign: "right",
  },
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  messageContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  messageText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
