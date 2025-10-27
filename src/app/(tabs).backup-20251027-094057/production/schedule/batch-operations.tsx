import { View, ScrollView } from "react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";

/**
 * Batch Operations Screen
 *
 * This feature allows bulk operations on production tasks (status updates,
 * sector reassignment, bulk delete). The multi-select checkboxes and bulk
 * actions are better suited for desktop/web interfaces.
 *
 * For mobile, individual task operations are recommended.
 */
export default function BatchOperationsScreen() {
  return (
    <PrivilegeGuard
      requiredPrivilege={[SECTOR_PRIVILEGES.LEADER, SECTOR_PRIVILEGES.ADMIN]}
    >
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <Text className="text-2xl font-bold">Operações em Lote</Text>

          <EmptyState
            icon="checkbox"
            title="Recurso Web Recomendado"
            description="As operações em lote de tarefas (seleção múltipla, atualização de status em massa, reatribuição de setores) são mais eficientes na versão web. No mobile, recomendamos editar tarefas individualmente."
          />

          {/* Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Operações Disponíveis (Web)</CardTitle>
            </CardHeader>
            <CardContent className="gap-2">
              <Text className="text-sm text-muted-foreground">
                • Seleção múltipla de tarefas com checkboxes
              </Text>
              <Text className="text-sm text-muted-foreground">
                • Atualização de status em lote
              </Text>
              <Text className="text-sm text-muted-foreground">
                • Reatribuição de setores em massa
              </Text>
              <Text className="text-sm text-muted-foreground">
                • Exclusão em lote com confirmação
              </Text>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </PrivilegeGuard>
  );
}
