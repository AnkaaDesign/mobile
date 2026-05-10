import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useHoliday } from "@/hooks";
import { routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { spacing } from "@/constants/design-system";
import { IconCalendar } from "@tabler/icons-react-native";
import type { Holiday } from "@/types";

import { DetailScreen } from "@/components/screens/detail-screen";
import { HolidayCard } from "@/components/personal/holiday";

export default function MyHolidayDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const query = useHoliday(id || "", {
    enabled: !!id && id !== "",
  });

  return (
    <DetailScreen<Holiday>
      query={query as any}
      icon={IconCalendar}
      title={(h) => h.name || "Feriado"}
      // Read-only mirror — feriados não são editáveis pelo usuário.
      editGuard={{ editable: [] }}
      notFoundFallback={mobileRoute(routes.personal.myHolidays.root)}
    >
      {(holiday) => (
        <View style={styles.body}>
          <HolidayCard holiday={holiday} />
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
