import { useState, useCallback } from "react";
import { View, StyleSheet, Alert, Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { usePpeDelivery, useScreenReady } from "@/hooks";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { PPE_DELIVERY_STATUS } from "@/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { API_BASE_URL } from "@/config/urls";
import { DetailPageLayout, DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import {
  IconShieldCheck,
  IconFileText,
} from "@tabler/icons-react-native";

// Import modular components
import { PpeDeliveryCard, PpeItemCard, CertificateCard } from "@/components/personal/ppe-delivery/detail";
import { SignDeliveryButton, SignatureEvidenceCard } from "@/components/human-resources/ppe/delivery/detail";

export default function PpeDeliveryDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { goBack } = useNavigationHistory();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = usePpeDelivery(id, {
    include: {
      user: true,
      reviewedByUser: true,
      item: {
        include: {
          category: true,
          brand: true,
        },
      },
      ppeSchedule: true,
      signature: {
        include: {
          signedByUser: true,
          signedDocument: true,
        },
      },
      deliveryDocument: true,
    },
    enabled: !!id && id !== "",
  });

  useScreenReady(!isLoading);

  const delivery = response?.data;

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch()
      .then(() => {
        Alert.alert("Sucesso", "Dados atualizados com sucesso");
      })
      .finally(() => {
        setRefreshing(false);
      });
  }, [refetch]);

  if (isLoading) {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          {/* Header card skeleton */}
          <Card style={styles.headerCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Skeleton style={{ width: 24, height: 24, borderRadius: 12 }} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton style={{ height: 16, width: '60%', borderRadius: 4 }} />
                <Skeleton style={{ height: 13, width: '35%', borderRadius: 4 }} />
              </View>
            </View>
          </Card>
          {/* Field skeletons matching label-above-value pattern */}
          <Card style={styles.skeletonCard}>
            <Skeleton style={{ height: 16, width: '45%', borderRadius: 4, marginBottom: spacing.md }} />
            <View style={{ gap: spacing.md }}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={{ gap: spacing.xs }}>
                  <Skeleton style={{ height: 12, width: '30%', borderRadius: 4 }} />
                  <Skeleton style={{ height: 36, width: '100%', borderRadius: 8 }} />
                </View>
              ))}
            </View>
          </Card>
          <Card style={styles.skeletonCard}>
            <Skeleton style={{ height: 16, width: '40%', borderRadius: 4, marginBottom: spacing.md }} />
            <View style={{ gap: spacing.md }}>
              {[1, 2].map((i) => (
                <View key={i} style={{ gap: spacing.xs }}>
                  <Skeleton style={{ height: 12, width: '25%', borderRadius: 4 }} />
                  <Skeleton style={{ height: 36, width: '100%', borderRadius: 8 }} />
                </View>
              ))}
            </View>
          </Card>
        </View>
      </View>
    );
  }

  if (error || !delivery || !id || id === "") {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card style={styles.skeletonCard}>
            <View style={styles.errorContent}>
              <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                <IconShieldCheck size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                Entrega não encontrada
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                A entrega solicitada não foi encontrada ou pode ter sido removida.
              </ThemedText>
              <Button onPress={() => goBack()}>
                <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
              </Button>
            </View>
          </Card>
        </View>
      </View>
    );
  }

  return (
    <DetailPageLayout refreshing={refreshing} onRefresh={handleRefresh}>
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={[styles.headerLeft, { flex: 1 }]}>
            <IconShieldCheck size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <ThemedText style={StyleSheet.flatten([styles.deliveryTitle, { color: colors.foreground }])} numberOfLines={1}>
                {delivery.item?.name || "Entrega de EPI"}
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.deliverySubtitle, { color: colors.mutedForeground }])} numberOfLines={1}>
                Entrega #{delivery.id.slice(0, 8)}
              </ThemedText>
            </View>
          </View>
        </View>
      </Card>

      {/* Modular Components */}
      <PpeDeliveryCard delivery={delivery} />
      <PpeItemCard item={delivery.item} />
      <CertificateCard item={delivery.item} />

      {/* In-App Signature — Sign or show evidence */}
      {(delivery.status === PPE_DELIVERY_STATUS.DELIVERED ||
        delivery.status === PPE_DELIVERY_STATUS.WAITING_SIGNATURE) && (
        <SignDeliveryButton delivery={delivery} />
      )}
      {delivery.status === PPE_DELIVERY_STATUS.COMPLETED && delivery.signature && (
        <SignatureEvidenceCard deliveryId={delivery.id} signature={delivery.signature} />
      )}

      {/* Delivery Document PDF — show when no in-app signature PDF */}
      {delivery.deliveryDocument && !delivery.signature?.signedDocumentId && (
        <DetailCard title="Termo de Entrega" icon="file-text">
          <Button
            onPress={() => {
              const url = `${API_BASE_URL}/files/serve/${delivery.deliveryDocument!.id}`;
              Linking.openURL(url).catch(() => {
                Alert.alert('Erro', 'Não foi possível abrir o documento.');
              });
            }}
            style={StyleSheet.flatten([styles.pdfButton, { backgroundColor: colors.primary }])}
          >
            <View style={styles.pdfButtonContent}>
              <IconFileText size={16} color="#ffffff" />
              <ThemedText style={styles.pdfButtonText}>Ver Termo de Entrega (PDF)</ThemedText>
            </View>
          </Button>
        </DetailCard>
      )}

      {/* Schedule Information */}
      {delivery.ppeSchedule && (
        <DetailCard title="Entrega Agendada" icon="calendar-event">
          <DetailField
            label="Informação"
            icon="info-circle"
            value="Esta entrega faz parte de um cronograma automatizado de distribuição de EPIs."
          />
        </DetailCard>
      )}
    </DetailPageLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
  headerCard: {
    padding: spacing.md,
  },
  skeletonCard: {
    padding: spacing.md,
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
  },
  deliveryTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  deliverySubtitle: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  errorContent: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: "600",
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  pdfButton: {
    paddingVertical: spacing.sm + 2,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pdfButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pdfButtonText: {
    color: "#ffffff",
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});
