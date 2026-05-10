import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useChangeLog } from "@/hooks";
import { routes, SECTOR_PRIVILEGES } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { DetailScreen } from "@/components/screens/detail-screen";
import { spacing } from "@/constants/design-system";
import { IconFileText } from "@tabler/icons-react-native";

import {
  ChangeLogCard,
  ChangesDiffCard,
  UserCard,
  EntityLinkCard,
} from "@/components/administration/change-log/detail";

export default function ChangeLogDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const query = useChangeLog(id as string, {
    include: { user: true },
    enabled: !!id,
  });

  return (
    <DetailScreen<any>
      query={query as any}
      icon={IconFileText}
      title={() => "Detalhes do Registro"}
      privilege={SECTOR_PRIVILEGES.ADMIN}
      notFoundFallback={mobileRoute(routes.server.changeLogs.list)}
    >
      {(changeLog) => (
        <View style={styles.body}>
          <ChangeLogCard changeLog={changeLog} />
          <ChangesDiffCard changeLog={changeLog} />
          <UserCard changeLog={changeLog} />
          <EntityLinkCard changeLog={changeLog} />
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
