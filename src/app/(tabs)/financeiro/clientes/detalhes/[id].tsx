import { useLocalSearchParams } from "expo-router";
import { View, StyleSheet } from "react-native";

import { useCustomer } from "@/hooks";
import {
  routes,
  CHANGE_LOG_ENTITY_TYPE,
  SECTOR_PRIVILEGES,
} from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { useAuth } from "@/contexts/auth-context";
import { hasAnyPrivilege } from "@/utils";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import {
  IconReceipt2,
  IconHistory,
  IconBuilding,
} from "@tabler/icons-react-native";
import { DetailScreen } from "@/components/screens/detail-screen";

import {
  CustomerCard,
  ContactInfoCard,
  AddressCard,
  TasksTable,
  CustomerInvoicesCard,
} from "@/components/administration/customer/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

/**
 * Financial Customer Detail Screen
 *
 * Shows customer details from a financial perspective with:
 * - Invoice history and payment status
 * - Financial documents (CNPJ/CPF)
 * - Task financial summaries
 * - Changelog for audit purposes
 */
export default function FinancialCustomerDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();

  const id = params?.id || "";

  // Financial module requires ADMIN, FINANCIAL privileges, or team leadership
  // to view documents.
  const canViewDocuments =
    user &&
    (hasAnyPrivilege(user, [
      SECTOR_PRIVILEGES.ADMIN,
      SECTOR_PRIVILEGES.FINANCIAL,
    ]) ||
      Boolean(user.ledSector?.id));

  const query = useCustomer(id, {
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
      _count: {
        select: {
          tasks: true,
          serviceOrders: true,
          services: true,
        },
      },
    },
    enabled: !!id && id !== "",
  });

  return (
    <DetailScreen<any>
      query={query as any}
      icon={IconBuilding}
      title={(c) => c.fantasyName ?? "Cliente"}
      privilege={{
        any: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.FINANCIAL],
      }}
      editRoute={(c) => mobileRoute(routes.financial.customers.edit(c.id))}
      notFoundFallback={mobileRoute(routes.financial.customers.root)}
    >
      {(customer) => (
        <View style={styles.body}>
          {/* Financial Info Badge */}
          <Card style={styles.card}>
            <View style={styles.financialBadge}>
              <IconReceipt2 size={20} color={colors.primary} />
              <ThemedText
                style={[styles.financialText, { color: colors.foreground }]}
              >
                Visualização Financeira
              </ThemedText>
            </View>
          </Card>

          <CustomerCard customer={customer} />
          <ContactInfoCard customer={customer} />
          <AddressCard customer={customer} />

          {/* Invoices - Priority in financial view */}
          {canViewDocuments && <CustomerInvoicesCard customer={customer} />}

          <TasksTable customer={customer} maxHeight={400} />

          {/* Changelog Timeline */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconHistory size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>
                  Histórico de Alterações
                </ThemedText>
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
  financialBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  financialText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
