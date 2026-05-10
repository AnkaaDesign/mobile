import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useBorrow } from "@/hooks";
import { CHANGE_LOG_ENTITY_TYPE, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { BORROW_SELECT_DETAIL } from "@/api-client/select-patterns";
import { spacing } from "@/constants/design-system";
import { IconPackage, IconHistory } from "@tabler/icons-react-native";
import type { Borrow } from "@/types";

import { DetailScreen } from "@/components/screens/detail-screen";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import {
  BorrowCard,
  BorrowItemCard,
  BorrowDatesCard,
  BorrowUserCard,
} from "@/components/personal/borrow/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function BorrowDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const query = useBorrow(id || "", {
    select: BORROW_SELECT_DETAIL,
    enabled: !!id && id !== "",
  });

  return (
    <DetailScreen<Borrow>
      query={query as any}
      icon={IconPackage}
      title={(b) => b.item?.name || "Empréstimo"}
      subtitle={(b) =>
        b.item?.uniCode ? `Código: ${b.item.uniCode}` : undefined
      }
      // User-scoped read-only mirror — no edit, no delete.
      editGuard={{ editable: [] }}
      notFoundFallback={mobileRoute(routes.personal.myBorrows.root)}
    >
      {(borrow) => (
        <View style={styles.body}>
          <BorrowCard borrow={borrow} />
          <BorrowItemCard borrow={borrow} />
          <BorrowDatesCard borrow={borrow} />
          <BorrowUserCard borrow={borrow} />

          <Card style={styles.card}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <IconHistory size={20} />
                <ThemedText style={styles.title}>
                  Histórico de Alterações
                </ThemedText>
              </View>
            </View>
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.BORROW}
              entityId={borrow.id}
              entityName={borrow.item?.name || "Empréstimo"}
              entityCreatedAt={borrow.createdAt}
              maxHeight={400}
            />
          </Card>
        </View>
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
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
    fontSize: 18,
    fontWeight: "500",
  },
});
