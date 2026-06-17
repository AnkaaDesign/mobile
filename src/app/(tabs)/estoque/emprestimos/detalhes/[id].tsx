import { View, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { useBorrow, useBorrowMutations } from "@/hooks";
import { useNav } from "@/contexts/nav";
import { usePrivilegeGate } from "@/hooks/use-privilege-gate";
import { spacing, borderRadius } from "@/constants/design-system";
import { BORROW_STATUS, SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { DetailScreen } from "@/components/screens/detail-screen";
import { EDITABLE_BORROW_STATUSES } from "@/constants/editable-statuses";
import { BorrowItemInfoCard } from "@/components/inventory/borrow/detail/borrow-item-info-card";
import { BorrowUserInfoCard } from "@/components/inventory/borrow/detail/borrow-user-info-card";
import { BorrowDatesCard } from "@/components/inventory/borrow/detail/borrow-dates-card";
import { BorrowHistoryCard } from "@/components/inventory/borrow/detail/borrow-history-card";
import { IconCheck, IconPackage } from "@tabler/icons-react-native";
import type { Borrow } from "@/types";

export default function BorrowDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const nav = useNav();
  const { update, deleteMutation } = useBorrowMutations();
  const canManage = usePrivilegeGate({ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }).allowed;

  // Fetch borrow details with include for full relations.
  const query = useBorrow(id as string, {
    include: {
      item: { include: { brands: true, category: true, supplier: true } },
      user: { include: { position: true, sector: true } },
    },
    enabled: !!id,
  });

  const handleReturn = (borrowId: string) => {
    Alert.alert(
      "Devolver Item",
      "Confirma a devolução deste item?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Devolver",
          style: "default",
          onPress: async () => {
            try {
              await nav.withLoading(async () =>
                update({
                  id: borrowId,
                  data: {
                    status: BORROW_STATUS.RETURNED,
                    returnedAt: new Date(),
                  },
                }),
              );
              await query.refetch();
            } catch {
              // API client surfaces the error.
            }
          },
        },
      ],
    );
  };

  return (
    <DetailScreen<Borrow>
      query={query as any}
      icon={IconPackage}
      title={(b) => `Empréstimo de ${b.user?.name ?? `#${String(b.id).slice(0, 8)}`}`}
      privilege={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.PRODUCTION] }}
      editPrivilege={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
      deletePrivilege={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
      editGuard={{ editable: EDITABLE_BORROW_STATUSES }}
      editRoute={(b) => mobileRoute(routes.inventory.borrows.edit(b.id))}
      deleteAction={{
        mutation: deleteMutation,
        confirmText:
          "Tem certeza que deseja excluir este empréstimo? Esta ação não pode ser desfeita.",
        successRoute: mobileRoute(routes.inventory.borrows.root),
      }}
      notFoundFallback={mobileRoute(routes.inventory.borrows.root)}
    >
      {(borrow, ctx) => (
        <View style={styles.body}>
          {ctx.isEditable && canManage && borrow.status === BORROW_STATUS.ACTIVE && (
            <TouchableOpacity
              onPress={() => handleReturn(borrow.id)}
              style={[styles.returnButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.7}
            >
              <IconCheck size={18} color={colors.primaryForeground} />
              <ThemedText
                style={[styles.returnButtonText, { color: colors.primaryForeground }]}
              >
                Devolver
              </ThemedText>
            </TouchableOpacity>
          )}

          <BorrowDatesCard borrow={borrow} />
          <BorrowItemInfoCard borrow={borrow as any} />
          <BorrowUserInfoCard borrow={borrow} />
          <BorrowHistoryCard borrow={borrow} />
        </View>
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
  },
  returnButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  returnButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
