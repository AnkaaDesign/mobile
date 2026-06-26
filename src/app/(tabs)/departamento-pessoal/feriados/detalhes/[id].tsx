import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useHoliday, useHolidayMutations } from "@/hooks/useHoliday";
import { CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { DetailScreen } from "@/components/screens/detail-screen";
import { spacing } from "@/constants/design-system";
import { IconCalendar } from "@tabler/icons-react-native";
import { HolidayCard } from "@/components/personnel-department/holiday/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function HolidayDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const holidayId = id || "";
  const { deleteMutation } = useHolidayMutations();

  const query = useHoliday(holidayId, { enabled: !!holidayId });

  return (
    <DetailScreen
      query={query as any}
      icon={IconCalendar}
      title={(h: any) => h.name ?? "Feriado"}
      privilege={{
        any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
      }}
      editRoute={(h: any) =>
        mobileRoute(routes.personnelDepartment.holidays.edit(h.id))
      }
      deleteAction={{
        mutation: deleteMutation,
        confirmText:
          "Tem certeza que deseja excluir este feriado? Esta ação não pode ser desfeita.",
        successRoute: mobileRoute(routes.personnelDepartment.holidays.root),
      }}
      notFoundFallback={mobileRoute(routes.personnelDepartment.holidays.root)}
    >
      {(holiday: any) => (
        <View style={styles.body}>
          <HolidayCard holiday={holiday} />
          <ChangelogTimeline
            entityType={CHANGE_LOG_ENTITY_TYPE.HOLIDAY}
            entityId={holiday.id}
            entityName={holiday.name}
            entityCreatedAt={holiday.createdAt}
            maxHeight={400}
          />
        </View>
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
  },
});
