import { Stack } from 'expo-router';
import { OrderCreateForm } from '@/components/inventory/order/form/order-create-form';
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";

export default function EstoquePedidosCadastrarScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Cadastrar Pedido',
          headerShown: true,
        }}
      />
      <OrderCreateForm key={formKey} />
    </>
  );
}
