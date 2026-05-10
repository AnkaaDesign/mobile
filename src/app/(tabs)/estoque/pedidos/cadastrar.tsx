import { Stack } from "expo-router";
import { OrderCreateForm } from "@/components/inventory/order/form/order-create-form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function EstoquePedidosCadastrarScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <OrderCreateInner />
    </PrivilegeGate>
  );
}

function OrderCreateInner() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return (
    <>
      <Stack.Screen
        options={{
          title: "Cadastrar Pedido",
          headerShown: true,
        }}
      />
      <OrderCreateForm key={formKey} />
    </>
  );
}
