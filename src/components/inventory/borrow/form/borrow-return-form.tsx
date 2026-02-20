
import { View, StyleSheet, Alert } from "react-native";
import { ThemedScrollView } from "@/components/ui/themed-scroll-view";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import type { Borrow } from '../../../../types';
import { IconLoader, IconPackage, IconFileText } from "@tabler/icons-react-native";
import { BORROW_STATUS } from "@/constants";
import { formatQuantity } from "@/utils";

interface BorrowReturnFormProps {
  borrow: Borrow & {
    item?: { name: string; brand?: { name: string } | null } | null;
    user?: { name: string } | null;
  };
  onReturn: () => Promise<void>;
  onMarkAsLost: () => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function BorrowReturnForm({ borrow, onReturn, onMarkAsLost, onCancel, isSubmitting }: BorrowReturnFormProps) {
  const { colors } = useTheme();
  const isReturned = borrow.status === BORROW_STATUS.RETURNED;
  const isLost = borrow.status === BORROW_STATUS.LOST;

  const handleReturn = () => {
    if (isReturned) {
      Alert.alert("Atenção", "Este empréstimo já foi devolvido.");
      return;
    }
    if (isLost) {
      Alert.alert("Atenção", "Este empréstimo foi marcado como perdido e não pode ser devolvido.");
      return;
    }

    Alert.alert(
      "Confirmar Devolução",
      "Tem certeza que deseja marcar este empréstimo como devolvido?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "default",
          onPress: onReturn,
        },
      ]
    );
  };

  const handleMarkAsLost = () => {
    if (isReturned) {
      Alert.alert("Atenção", "Este empréstimo já foi devolvido e não pode ser marcado como perdido.");
      return;
    }
    if (isLost) {
      Alert.alert("Atenção", "Este empréstimo já foi marcado como perdido.");
      return;
    }

    Alert.alert(
      "Confirmar Perda",
      "Tem certeza que deseja marcar este empréstimo como perdido? Esta ação irá ajustar o estoque do item.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: onMarkAsLost,
        },
      ]
    );
  };

  const getStatusColor = () => {
    switch (borrow.status) {
      case BORROW_STATUS.ACTIVE:
        return colors.primary;
      case BORROW_STATUS.RETURNED:
        return "#10b981";
      case BORROW_STATUS.LOST:
        return colors.destructive;
      default:
        return colors.mutedForeground;
    }
  };

  const getStatusLabel = () => {
    switch (borrow.status) {
      case BORROW_STATUS.ACTIVE:
        return "Ativo";
      case BORROW_STATUS.RETURNED:
        return "Devolvido";
      case BORROW_STATUS.LOST:
        return "Perdido";
      default:
        return borrow.status;
    }
  };

  return (
    <ThemedScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        {/* Borrow Information */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconPackage size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Informações do Empréstimo</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <View style={styles.fieldGroup}>
              {/* Status */}
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Status:</ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + "20" }]}>
                  <ThemedText style={[styles.statusText, { color: getStatusColor() }]}>
                    {getStatusLabel()}
                  </ThemedText>
                </View>
              </View>

              {/* Item */}
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Item:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {borrow.item?.name || "N/A"}
                  {borrow.item?.brand ? ` - ${borrow.item.brand.name}` : ""}
                </ThemedText>
              </View>

              {/* User */}
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Usuário:</ThemedText>
                <ThemedText style={styles.infoValue}>{borrow.user?.name || "N/A"}</ThemedText>
              </View>

              {/* Quantity */}
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Quantidade:</ThemedText>
                <ThemedText style={styles.infoValue}>{formatQuantity(borrow.quantity)}</ThemedText>
              </View>

              {/* Created At */}
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Data de Criação:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {new Date(borrow.createdAt).toLocaleDateString("pt-BR")}
                </ThemedText>
              </View>

              {/* Returned At */}
              {borrow.returnedAt && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Data de Devolução:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {new Date(borrow.returnedAt).toLocaleDateString("pt-BR")}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Actions */}
        {!isReturned && !isLost && (
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconFileText size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Ações Disponíveis</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              <View style={styles.actionButtons}>
                <View style={[styles.actionButton, { backgroundColor: "#10b981" }]}>
                  <Button
                    onPress={handleReturn}
                    disabled={isSubmitting}
                    style={{ flex: 1 }}
                  >
                    {isSubmitting ? (
                      <>
                        <IconLoader size={20} color="#ffffff" />
                        <ThemedText style={styles.actionButtonText}>Processando...</ThemedText>
                      </>
                    ) : (
                      <>
                        <Icon name="checkCircle" size={20} color="#ffffff" />
                        <ThemedText style={styles.actionButtonText}>Marcar como Devolvido</ThemedText>
                      </>
                    )}
                  </Button>
                </View>

                <Button
                  variant="destructive"
                  onPress={handleMarkAsLost}
                  disabled={isSubmitting}
                  style={styles.actionButton}
                >
                  {isSubmitting ? (
                    <>
                      <IconLoader size={20} color="#ffffff" />
                      <ThemedText style={styles.actionButtonText}>Processando...</ThemedText>
                    </>
                  ) : (
                    <>
                      <Icon name="alertCircle" size={20} color="#ffffff" />
                      <ThemedText style={styles.actionButtonText}>Marcar como Perdido</ThemedText>
                    </>
                  )}
                </Button>
              </View>

              <View style={styles.helpTextContainer}>
                <Icon name="info" size={16} color={colors.mutedForeground} />
                <ThemedText style={styles.helpText}>
                  Marcar como devolvido retorna o item ao estoque. Marcar como perdido ajusta o estoque permanentemente.
                </ThemedText>
              </View>
            </View>
          </Card>
        )}

        {/* Back Button */}
        <View style={styles.backButtonContainer}>
          <Button variant="outline" onPress={onCancel} disabled={isSubmitting} style={styles.backButton}>
            Voltar
          </Button>
        </View>
      </View>
    </ThemedScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  card: {
    marginBottom: spacing.lg,
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
  fieldGroup: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    flex: 1,
  },
  infoValue: {
    fontSize: fontSize.sm,
    flex: 2,
    textAlign: "right",
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  actionButtons: {
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: fontSize.base,
    fontWeight: "500",
  },
  helpTextContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 8,
  },
  helpText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: "#6b7280",
    lineHeight: fontSize.xs * 1.5,
  },
  backButtonContainer: {
    marginTop: spacing.lg,
  },
  backButton: {
    width: "100%",
  },
});
