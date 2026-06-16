import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useBorrow } from "@/hooks";
import { routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { BORROW_SELECT_DETAIL } from "@/api-client/select-patterns";
import { spacing } from "@/constants/design-system";
import { IconPackage } from "@tabler/icons-react-native";
import type { Borrow } from "@/types";

import { DetailScreen } from "@/components/screens/detail-screen";
import {
  BorrowCard,
  BorrowItemCard,
  BorrowDatesCard,
} from "@/components/personal/borrow/detail";

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
      // User-scoped read-only mirror — no edit, no delete. The production user
      // can't edit anything here, so the refresh button (pull-to-refresh
      // covers it) and the terminal-state banner are both suppressed.
      editGuard={{ editable: [] }}
      hideRefresh
      hideTerminalBanner
      notFoundFallback={mobileRoute(routes.personal.myBorrows.root)}
    >
      {(borrow) => (
        <View style={styles.body}>
          <BorrowCard borrow={borrow} />
          <BorrowItemCard borrow={borrow} />
          <BorrowDatesCard borrow={borrow} />
        </View>
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
});
