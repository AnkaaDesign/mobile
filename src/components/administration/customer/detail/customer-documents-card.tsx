
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconFileDescription, IconBuilding, IconId } from "@tabler/icons-react-native";
import type { Customer } from '../../../../types';
import { formatCNPJ, formatCPF } from '../../../../utils';

interface CustomerDocumentsCardProps {
  customer: Customer;
}

export function CustomerDocumentsCard({ customer }: CustomerDocumentsCardProps) {
  const { colors } = useTheme();

  // Check if customer has any documents
  const hasDocs = customer.cnpj || customer.cpf;

  if (!hasDocs) {
    return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconFileDescription size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Documentos</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <ThemedText style={[styles.emptyState, { color: colors.mutedForeground }]}>
            Nenhum documento configurado
          </ThemedText>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconFileDescription size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Documentos</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <ThemedText style={[styles.subsectionTitle, { color: colors.foreground }]}>
          Documentação
        </ThemedText>

        {/* CNPJ */}
        {customer.cnpj && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <IconBuilding size={20} color={colors.mutedForeground} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                CNPJ
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: colors.foreground, fontFamily: 'monospace' }]}>
                {formatCNPJ(customer.cnpj)}
              </ThemedText>
            </View>
          </View>
        )}

        {/* CPF */}
        {customer.cpf && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <IconId size={20} color={colors.mutedForeground} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                CPF
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: colors.foreground, fontFamily: 'monospace' }]}>
                {formatCPF(customer.cpf)}
              </ThemedText>
            </View>
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
    fontWeight: "500",
  },
  content: {
    gap: spacing.md,
  },
  subsectionTitle: {
    fontSize: fontSize.base,
    fontWeight: "500",
  },
  detailRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  detailIcon: {
    paddingTop: 2,
  },
  detailContent: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: fontSize.sm,
  },
  emptyState: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
});
