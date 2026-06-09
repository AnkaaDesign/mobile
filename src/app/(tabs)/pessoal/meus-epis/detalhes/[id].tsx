import { useRef } from "react";
import { View, StyleSheet, Alert, Linking, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { usePpeDelivery } from "@/hooks";
import { PPE_DELIVERY_STATUS, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { API_BASE_URL } from "@/config/urls";
import { spacing, fontSize } from "@/constants/design-system";
import { IconShieldCheck, IconFileText } from "@tabler/icons-react-native";
import type { PpeDelivery } from "@/types";

import { DetailScreen } from "@/components/screens/detail-screen";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import {
  PpeDeliveryCard,
  PpeItemCard,
  CertificateCard,
} from "@/components/personal/ppe-delivery/detail";
import {
  SignDeliveryButton,
  SignatureEvidenceCard,
} from "@/components/human-resources/ppe/delivery/detail";

export default function PpeDeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  // Forwarded into DetailScreen + SignDeliveryButton so the tutorial step that
  // spotlights the sign button can scroll it into view on small screens — the
  // sign card sits below the item / certificate cards and would otherwise stay
  // off-screen.
  const scrollRef = useRef<ScrollView | null>(null);

  const query = usePpeDelivery(id || "", {
    include: {
      user: true,
      reviewedByUser: true,
      item: {
        include: {
          category: true,
          brands: true,
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

  return (
    <DetailScreen<PpeDelivery>
      query={query as any}
      icon={IconShieldCheck}
      title={(d) => d.item?.name || "Entrega de EPI"}
      subtitle={(d) => `Entrega #${d.id.slice(0, 8)}`}
      // Read-only mirror — user signs from card actions, no edit page.
      editGuard={{ editable: [] }}
      notFoundFallback={mobileRoute(routes.personal.myPpes.root)}
      scrollRef={scrollRef}
    >
      {(delivery) => (
        <View style={styles.body}>
          <PpeDeliveryCard delivery={delivery} />
          <PpeItemCard item={delivery.item} />
          <CertificateCard item={delivery.item} />

          {/* In-App Signature — Sign or show evidence */}
          {(delivery.status === PPE_DELIVERY_STATUS.DELIVERED ||
            delivery.status === PPE_DELIVERY_STATUS.WAITING_SIGNATURE) && (
            <SignDeliveryButton delivery={delivery} scrollContainer={scrollRef} />
          )}
          {delivery.status === PPE_DELIVERY_STATUS.COMPLETED &&
            delivery.signature && (
              <SignatureEvidenceCard
                deliveryId={delivery.id}
                signature={delivery.signature}
              />
            )}

          {/* Delivery Document PDF */}
          {delivery.deliveryDocument &&
            !delivery.signature?.signedDocumentId && (
              <DetailCard title="Termo de Entrega" icon="file-text">
                <Button
                  onPress={() => {
                    const url = `${API_BASE_URL}/files/serve/${delivery.deliveryDocument!.id}`;
                    Linking.openURL(url).catch(() => {
                      Alert.alert("Erro", "Não foi possível abrir o documento.");
                    });
                  }}
                  style={StyleSheet.flatten([
                    styles.pdfButton,
                    { backgroundColor: colors.primary },
                  ])}
                >
                  <View style={styles.pdfButtonContent}>
                    <IconFileText size={16} color="#ffffff" />
                    <ThemedText style={styles.pdfButtonText}>
                      Ver Termo de Entrega (PDF)
                    </ThemedText>
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
        </View>
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
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
