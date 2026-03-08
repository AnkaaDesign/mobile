import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
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
    <DetailCard title="Documentos" icon="file-text">
        {hasDocuments ? (
          <View style={styles.documentsContainer}>
            {/* CNPJ Information */}
            {supplier.cnpj && (
              <View style={styles.section}>
                <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
                  Documentação Legal
                </ThemedText>
                <DetailField
                  label="CNPJ"
                  value={formatCNPJ(supplier.cnpj)}
                  icon="certificate"
                />
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
    </DetailCard>
  );
}

const styles = StyleSheet.create({
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
