import { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  IconChevronRight,
  IconWritingSign,
} from "@tabler/icons-react-native";
import { ThemedView, ThemedText, ErrorScreen } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useMyAssinaturas } from "@/hooks/secullum";
import { APURACAO_ESTADO } from "@/types/secullum";
import type { SecullumApuracaoListItem } from "@/types/secullum";
import { useScreenReady } from "@/hooks/use-screen-ready";

function fmtDate(iso?: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

type BadgeVariant = "success" | "destructive" | "warning";

function estadoMeta(estado: number): { label: string; variant: BadgeVariant } {
  switch (estado) {
    case APURACAO_ESTADO.APROVADO:
      return { label: "Aprovado", variant: "success" };
    case APURACAO_ESTADO.REJEITADO:
      return { label: "Rejeitado", variant: "destructive" };
    default:
      return { label: "Pendente", variant: "warning" };
  }
}

export default function AssinaturasListScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useMyAssinaturas();
  useScreenReady(!isLoading);

  const body = data?.data;
  const items: SecullumApuracaoListItem[] = (body?.success ? body.data : []) ?? [];

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  if (error) {
    const message =
      (error as any)?.response?.data?.message ||
      (error as any)?.message ||
      "Erro ao carregar apurações";
    return (
      <>
        <Stack.Screen options={{ title: "Assinatura de Ponto" }} />
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
          <ErrorScreen
            message="Erro ao carregar apurações"
            detail={message}
            onRetry={handleRefresh}
          />
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Assinatura de Ponto" }} />
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {isLoading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => String(it.id)}
            contentContainerStyle={{
              padding: 12,
              paddingBottom: insets.bottom + 24,
              gap: 10,
              flexGrow: 1,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
                  <IconWritingSign size={40} color={colors.mutedForeground} />
                </View>
                <ThemedText style={styles.emptyTitle}>Nenhuma apuração</ThemedText>
                <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Você não tem cartões-ponto aguardando assinatura.
                </ThemedText>
              </View>
            }
            renderItem={({ item }) => {
              const meta = estadoMeta(item.estado);
              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() =>
                    nav.push(mobileRoute(`/pessoal/meus-pontos/assinaturas/${item.id}`))
                  }
                >
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={styles.titleRow}>
                      <ThemedText style={[styles.rowTitle, { flex: 1 }]} numberOfLines={2}>
                        {item.descricao}
                      </ThemedText>
                      <Badge variant={meta.variant} size="sm">
                        {meta.label}
                      </Badge>
                    </View>
                    <ThemedText style={[styles.rowPeriod, { color: colors.mutedForeground }]}>
                      {fmtDate(item.dataInicio)} - {fmtDate(item.dataFim)}
                    </ThemedText>
                  </View>
                  <IconChevronRight size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              );
            }}
          />
        )}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowPeriod: { fontSize: 13, fontWeight: "500" },
});
