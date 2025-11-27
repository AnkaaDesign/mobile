
import { View, StyleSheet } from "react-native";
import type { User } from '../../../../types';
import { formatZipCode, formatDate, getAge } from "@/utils";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconHome, IconBuildingCommunity, IconMap, IconMailbox, IconUser, IconCake, IconHash } from "@tabler/icons-react-native";

interface AddressCardProps {
  employee: User;
}

export function AddressCard({ employee }: AddressCardProps) {
  const { colors } = useTheme();

  const hasAddress = employee.address || employee.neighborhood || employee.city || employee.state || employee.zipCode;
  const hasPersonalInfo = employee.birth || employee.payrollNumber;

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <IconUser size={18} color="#16a34a" />
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
            Informações Pessoais
          </ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Dados Pessoais Section */}
        {hasPersonalInfo && (
          <>
            <ThemedText style={[styles.subsectionTitle, { color: colors.foreground }]}>
              Dados Pessoais
            </ThemedText>

            {employee.birth && (
              <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
                <View style={styles.labelWithIcon}>
                  <IconCake size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                    Data de Nascimento
                  </ThemedText>
                </View>
                <ThemedText style={[styles.value, { color: colors.foreground }]}>
                  {formatDate(employee.birth)} ({getAge(employee.birth)} anos)
                </ThemedText>
              </View>
            )}

            {employee.payrollNumber && (
              <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
                <View style={styles.labelWithIcon}>
                  <IconHash size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                    Número da Folha
                  </ThemedText>
                </View>
                <ThemedText style={[styles.value, { color: colors.foreground }]}>
                  {employee.payrollNumber}
                </ThemedText>
              </View>
            )}

            {hasAddress && <View style={[styles.separator, { backgroundColor: colors.border }]} />}
          </>
        )}

        {/* Address Section */}
        {hasAddress ? (
          <>
            <ThemedText style={[styles.subsectionTitle, { color: colors.foreground }]}>
              Endereço
            </ThemedText>

            {employee.address && (
              <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
                <View style={styles.labelWithIcon}>
                  <IconHome size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                    Endereço
                  </ThemedText>
                </View>
                <View style={styles.addressValueContainer}>
                  <ThemedText style={[styles.value, { color: colors.foreground }]}>
                    {employee.address}
                    {employee.addressNumber && `, ${employee.addressNumber}`}
                  </ThemedText>
                  {employee.addressComplement && (
                    <ThemedText style={[styles.complementText, { color: colors.mutedForeground }]}>
                      {employee.addressComplement}
                    </ThemedText>
                  )}
                </View>
              </View>
            )}

            {employee.neighborhood && (
              <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
                <View style={styles.labelWithIcon}>
                  <IconBuildingCommunity size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                    Bairro
                  </ThemedText>
                </View>
                <ThemedText style={[styles.value, { color: colors.foreground }]}>
                  {employee.neighborhood}
                </ThemedText>
              </View>
            )}

            {(employee.city || employee.state) && (
              <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
                <View style={styles.labelWithIcon}>
                  <IconMap size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                    Cidade/Estado
                  </ThemedText>
                </View>
                <ThemedText style={[styles.value, { color: colors.foreground }]}>
                  {employee.city}
                  {employee.city && employee.state && " - "}
                  {employee.state}
                </ThemedText>
              </View>
            )}

            {employee.zipCode && (
              <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
                <View style={styles.labelWithIcon}>
                  <IconMailbox size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                    CEP
                  </ThemedText>
                </View>
                <ThemedText style={[styles.value, styles.monospace, { color: colors.foreground }]}>
                  {formatZipCode(employee.zipCode)}
                </ThemedText>
              </View>
            )}
          </>
        ) : hasPersonalInfo ? null : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted + "30" }]}>
              <IconUser size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={[styles.emptyTitle, { color: colors.foreground }]}>
              Nenhuma informação pessoal cadastrada
            </ThemedText>
            <ThemedText style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
              Este usuário não possui informações pessoais registradas.
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    gap: spacing.md,
  },
  subsectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  separator: {
    height: 1,
    marginVertical: spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: "right",
  },
  addressValueContainer: {
    alignItems: "flex-end",
    flex: 1,
    marginLeft: spacing.md,
  },
  complementText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs / 2,
  },
  monospace: {
    fontFamily: "monospace",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
