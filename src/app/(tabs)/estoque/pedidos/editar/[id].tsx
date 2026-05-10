import { Stack, useLocalSearchParams } from "expo-router";
import { OrderEditForm } from "@/components/inventory/order/form/order-edit-form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function EstoquePedidosEditarScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <OrderEditInner />
    </PrivilegeGate>
  );
}

function OrderEditInner() {
  useScreenReady();
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Editar Pedido",
          headerShown: true,
        }}
      />
      <OrderEditForm key={id} orderId={id} />
    </>
  );
}
