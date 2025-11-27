import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconFileText, IconCertificate } from "@tabler/icons-react-native";
import type { Supplier } from "@/types";
import type { File as AnkaaFile } from "@/types";
import { formatCNPJ } from "@/utils";
import { FileItem } from "@/components/file";

interface DocumentsCardProps {
  supplier: Supplier;
  // Extended supplier type that includes document fields (for future use)
  contracts?: AnkaaFile[];
  certificates?: AnkaaFile[];
  otherDocuments?: AnkaaFile[];
}

export function DocumentsCard({
  supplier,
  contracts = [],
  certificates = [],
  otherDocuments = [],
}: DocumentsCardProps) {
  const { colors } = useTheme();

  const allDocuments = [...contracts, ...certificates, ...otherDocuments];
  const hasDocuments = supplier.cnpj || allDocuments.length > 0;

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconFileText size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Documentos</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {hasDocuments ? (
          <View style={styles.documentsContainer}>
            {/* CNPJ Information */}
            {supplier.cnpj && (
              <View style={styles.section}>
                <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
                  Documentação Legal
                </ThemedText>
                <View style={styles.fieldsContainer}>
                  <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                    <View style={styles.fieldLabelWithIcon}>
                      <IconCertificate size={16} color={colors.mutedForeground} />
                      <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                        CNPJ
                      </ThemedText>
                    </View>
                    <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                      {formatCNPJ(supplier.cnpj)}
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}

            {/* Contracts Section */}
            {contracts.length > 0 && (
              <View style={[styles.section, supplier.cnpj ? styles.sectionWithBorder : null, supplier.cnpj ? { borderTopColor: colors.border + "50" } : null]}>
                <View style={styles.sectionHeaderRow}>
                  <IconFileText size={20} color="#ef4444" />
                  <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
                    Contratos
                  </ThemedText>
                </View>
                <View style={styles.filesContainer}>
                  {contracts.map((file) => (
                    <FileItem
                      key={file.id}
                      file={file}
                      viewMode="list"
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Certificates Section */}
            {certificates.length > 0 && (
              <View style={[styles.section, (supplier.cnpj || contracts.length > 0) ? styles.sectionWithBorder : null, (supplier.cnpj || contracts.length > 0) ? { borderTopColor: colors.border + "50" } : null]}>
                <View style={styles.sectionHeaderRow}>
                  <IconCertificate size={20} color="#3b82f6" />
                  <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
                    Certificados
                  </ThemedText>
                </View>
                <View style={styles.filesContainer}>
                  {certificates.map((file) => (
                    <FileItem
                      key={file.id}
                      file={file}
                      viewMode="list"
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Other Documents Section */}
            {otherDocuments.length > 0 && (
              <View style={[styles.section, (supplier.cnpj || contracts.length > 0 || certificates.length > 0) ? styles.sectionWithBorder : null, (supplier.cnpj || contracts.length > 0 || certificates.length > 0) ? { borderTopColor: colors.border + "50" } : null]}>
                <View style={styles.sectionHeaderRow}>
                  <IconFileText size={20} color={colors.mutedForeground} />
                  <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
                    Outros Documentos
                  </ThemedText>
                </View>
                <View style={styles.filesContainer}>
                  {otherDocuments.map((file) => (
                    <FileItem
                      key={file.id}
                      file={file}
                      viewMode="list"
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        ) : (
          /* Empty State */
          <View style={styles.emptyState}>
            <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted + "30" }])}>
              <IconFileText size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.emptyTitle, { color: colors.foreground }])}>
              Nenhum documento cadastrado
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.emptyDescription, { color: colors.mutedForeground }])}>
              Este fornecedor não possui documentos cadastrados.
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
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
  documentsContainer: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.lg,
  },
  sectionWithBorder: {
    paddingTop: spacing.xl,
    borderTopWidth: 1,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  subsectionHeader: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  fieldsContainer: {
    gap: spacing.md,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  fieldLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  fieldValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: "right",
  },
  filesContainer: {
    gap: spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});
