import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useCustomer } from "@/hooks";
import { routes, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { DetailScreen } from "@/components/screens/detail-screen";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconBuilding, IconHistory } from "@tabler/icons-react-native";

import {
  CustomerCard,
  ContactInfoCard,
  AddressCard,
  TasksTable,
  ServiceOrdersTable,
} from "@/components/administration/customer/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const query = useCustomer(id as string, {
    select: {
      id: true,
      fantasyName: true,
      corporateName: true,
      cnpj: true,
      cpf: true,
      registrationStatus: true,
      tags: true,
      email: true,
      phones: true,
      site: true,
      address: true,
      addressNumber: true,
      addressComplement: true,
      neighborhood: true,
      city: true,
      state: true,
      zipCode: true,
      createdAt: true,
      logoId: true,
      logo: { select: { id: true } },
      tasks: {
        select: {
          id: true,
          serialNumber: true,
          description: true,
          status: true,
          finishedAt: true,
          term: true,
        },
        take: 10,
      },
    },
    enabled: !!id,
  });

  return (
    <DetailScreen<any>
      query={query as any}
      icon={IconBuilding}
      title={(c) => c.fantasyName ?? "Cliente"}
      editRoute={(c) => mobileRoute(routes.administration.customers.edit(c.id))}
      notFoundFallback={mobileRoute(routes.administration.customers.list)}
    >
      {(customer) => (
        <View style={styles.body}>
          <CustomerCard customer={customer} />
          <ContactInfoCard customer={customer} />
          <AddressCard customer={customer} />
          <TasksTable customer={customer} maxHeight={400} />
          <ServiceOrdersTable customer={customer} maxHeight={400} />
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconHistory size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Histórico de Alterações</ThemedText>
              </View>
            </View>
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.CUSTOMER}
              entityId={customer.id}
              entityName={customer.fantasyName}
              entityCreatedAt={customer.createdAt}
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
    gap: spacing.lg,
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
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
});
