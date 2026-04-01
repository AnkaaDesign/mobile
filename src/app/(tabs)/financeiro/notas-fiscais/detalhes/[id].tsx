import { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useNfseDetail } from "@/hooks/useNfse";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { NfseEnrichedInfo } from "@/components/production/task/billing/nfse-enriched-info";
import { useTheme } from "@/lib/theme";
import {
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from "@/constants/design-system";
import {
  IconFileInvoice,
  IconUser,
  IconBuilding,
  IconReceipt,
} from "@tabler/icons-react-native";
import { formatCurrency, formatDate } from "@/utils/formatters";

function formatDocument(doc: string | null | undefined): { label: string; value: string } | null {
  if (!doc) return null;
  const clean = doc.replace(/\D/g, "");
  if (clean.length === 11) {
    return {
      label: "CPF",
      value: clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
    };
  }
  if (clean.length === 14) {
    return {
      label: "CNPJ",
      value: clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5"),
    };
  }
  return { label: "CNPJ/CPF", value: doc };
}

function buildAddress(tomador: any): string | null {
  const parts = [
    tomador.endereco,
    tomador.numeroEndereco,
    tomador.complementoEndereco,
    tomador.bairro,
    typeof tomador.cidade === "object"
      ? tomador.cidade?.descricao || tomador.cidade?.nome || tomador.cidade?.name
      : tomador.cidade,
    typeof tomador.uf === "object"
      ? tomador.uf?.descricao || tomador.uf?.id?.unidadeFederacao || tomador.uf?.sigla || tomador.uf?.nome
      : tomador.uf,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function buildCidade(tomador: any): string | null {
  const cidade = typeof tomador.cidade === "object"
    ? tomador.cidade?.descricao || tomador.cidade?.nome || tomador.cidade?.name || ""
    : tomador.cidade || "";
  const uf = typeof tomador.uf === "object"
    ? tomador.uf?.descricao || tomador.uf?.id?.unidadeFederacao || tomador.uf?.sigla || tomador.uf?.nome || ""
    : tomador.uf || "";
  if (!cidade && !uf) return null;
  if (cidade && uf) return `${cidade}/${uf}`;
  return cidade || uf || null;
}

export default function NfseDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { goBack } = useNavigationHistory();
  const [refreshing, setRefreshing] = useState(false);

  const elotechNfseId = Number(params?.id || 0);

  const {
    data: detail,
    isLoading,
    error,
    refetch,
  } = useNfseDetail(elotechNfseId, { enabled: !!elotechNfseId });

  useScreenReady(!isLoading);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
    });
  }, [refetch]);

  if (isLoading) {
    return (
      <View
        style={[styles.centered, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !detail || !elotechNfseId) {
    return (
      <View
        style={[styles.scrollView, { backgroundColor: colors.background }]}
      >
        <View style={styles.container}>
          <Card style={styles.card}>
            <View style={styles.errorContent}>
              <View
                style={[
                  styles.errorIcon,
                  { backgroundColor: colors.muted },
                ]}
              >
                <IconFileInvoice
                  size={32}
                  color={colors.mutedForeground}
                />
              </View>
              <ThemedText
                style={[
                  styles.errorTitle,
                  { color: colors.foreground },
                ]}
              >
                NFS-e nao encontrada
              </ThemedText>
              <ThemedText
                style={[
                  styles.errorDescription,
                  { color: colors.mutedForeground },
                ]}
              >
                A nota fiscal solicitada nao foi encontrada ou pode ter sido
                removida.
              </ThemedText>
              <Button onPress={() => goBack()}>
                <ThemedText style={{ color: colors.primaryForeground }}>
                  Voltar
                </ThemedText>
              </Button>
            </View>
          </Card>
        </View>
      </View>
    );
  }

  // Extract data from Elotech detail response
  const dadosNfse = detail.formDadosNFSe;
  const tomador = detail.formTomador;
  const servico = detail.formServico;
  const imposto = detail.formImposto;
  const total = detail.formTotal;

  const numeroNfse = dadosNfse?.numeroNfse;
  const dataEmissao = dadosNfse?.dataEmissao;

  // Use localStatus (enriched by API) like web, fallback to situacao
  const localStatus = (detail as any).localStatus;
  const cancelada = localStatus === "CANCELLED" || dadosNfse?.situacao === 4 || dadosNfse?.situacao === "4";
  const emitida = localStatus === "AUTHORIZED" || (!cancelada && (dadosNfse?.situacao === 1 || dadosNfse?.situacao === "1"));

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <IconFileInvoice size={24} color={colors.primary} />
              <ThemedText
                style={[
                  styles.headerTitle,
                  { color: colors.foreground },
                ]}
              >
                NFS-e {numeroNfse ? `#${numeroNfse}` : ""}
              </ThemedText>
            </View>
            {cancelada ? (
              <Badge variant="gray" size="default">
                <ThemedText style={styles.badgeText}>Cancelada</ThemedText>
              </Badge>
            ) : emitida ? (
              <Badge variant="green" size="default">
                <ThemedText style={styles.badgeText}>Emitida</ThemedText>
              </Badge>
            ) : (
              <Badge variant="secondary" size="default">
                <ThemedText style={styles.badgeText}>
                  {(detail as any).descricaoSituacao || "Pendente"}
                </ThemedText>
              </Badge>
            )}
          </View>
        </Card>

        {/* NFS-e Enriched Info (values, PDF download) */}
        <NfseEnrichedInfo
          elotechNfseId={elotechNfseId}
          showPdfLink
        />

        {/* Tomador (Recipient) Card */}
        {tomador && (
          <Card style={styles.card}>
            <View
              style={[
                styles.sectionHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <IconUser size={18} color={colors.mutedForeground} />
              <ThemedText style={styles.sectionTitle}>Tomador</ThemedText>
            </View>
            <View style={styles.infoGrid}>
              <InfoRow
                label="Nome/Razao Social"
                value={tomador.razao || tomador.razaoNome || (detail as any).customerName}
                colors={colors}
              />
              {(() => {
                const doc = formatDocument(tomador.cnpjCpf);
                return doc ? <InfoRow label={doc.label} value={doc.value} colors={colors} /> : null;
              })()}
              <InfoRow
                label="Endereco"
                value={buildAddress(tomador)}
                colors={colors}
              />
              <InfoRow
                label="CEP"
                value={tomador.cep}
                colors={colors}
              />
              <InfoRow
                label="Telefone"
                value={tomador.telefone}
                colors={colors}
              />
              <InfoRow
                label="E-mail"
                value={tomador.email}
                colors={colors}
              />
            </View>
          </Card>
        )}

        {/* Service Card */}
        {servico && (
          <Card style={styles.card}>
            <View
              style={[
                styles.sectionHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <IconBuilding size={18} color={colors.mutedForeground} />
              <ThemedText style={styles.sectionTitle}>Servico</ThemedText>
            </View>
            <View style={styles.infoGrid}>
              <InfoRow
                label="Descricao"
                value={servico.discriminacaoServico || servico.descricaoServico}
                colors={colors}
              />
              <InfoRow
                label="Codigo Servico"
                value={servico.codigoServico}
                colors={colors}
              />
              <InfoRow
                label="Valor Servico"
                value={formatCurrency(servico.valorServico)}
                colors={colors}
              />
            </View>
          </Card>
        )}

        {/* Taxes & Totals Card */}
        <Card style={styles.card}>
          <View
            style={[
              styles.sectionHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <IconReceipt size={18} color={colors.mutedForeground} />
            <ThemedText style={styles.sectionTitle}>
              Impostos e Totais
            </ThemedText>
          </View>
          <View style={styles.infoGrid}>
            <InfoRow
              label="Total NFS-e"
              value={formatCurrency(total?.totalNfse)}
              colors={colors}
            />
            <InfoRow
              label="Valor ISS"
              value={formatCurrency(imposto?.valorIss)}
              colors={colors}
            />
            <InfoRow
              label="Aliquota ISS"
              value={
                imposto?.aliquotaIss
                  ? `${imposto.aliquotaIss}%`
                  : null
              }
              colors={colors}
            />
            <InfoRow
              label="Base de Calculo"
              value={formatCurrency(imposto?.baseCalculo)}
              colors={colors}
            />
            <InfoRow
              label="ISS Retido"
              value={imposto?.issRetido ? "Sim" : "Nao"}
              colors={colors}
            />
          </View>
        </Card>

        {/* Bottom spacing */}
        <View style={{ height: spacing.md }} />
      </View>
    </ScrollView>
  );
}

// ── Info Row Component ──────────────────────────

function InfoRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: any;
  colors: any;
}) {
  if (value == null || value === "" || value === "-") return null;

  // Safely convert value to string, handling nested objects
  const displayValue = typeof value === 'object'
    ? (value?.nome || value?.name || value?.label || JSON.stringify(value))
    : String(value);

  return (
    <View
      style={[styles.infoRow, { backgroundColor: colors.muted }]}
    >
      <ThemedText
        style={[styles.infoLabel, { color: colors.mutedForeground }]}
      >
        {label}
      </ThemedText>
      <ThemedText
        style={[styles.infoValue, { color: colors.foreground }]}
        numberOfLines={3}
      >
        {displayValue}
      </ThemedText>
    </View>
  );
}

// ── Styles ──────────────────────────────────────

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  headerCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  badgeText: {
    fontSize: fontSize.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
  infoGrid: {
    gap: spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1.5,
    textAlign: "right",
  },
  errorContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
});
