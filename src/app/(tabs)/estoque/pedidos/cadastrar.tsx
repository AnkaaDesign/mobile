import { Stack } from 'expo-router';
import { OrderCreateForm } from '@/components/inventory/order/form/order-create-form';
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function EstoquePedidosCadastrarScreen() {
  useScreenReady();
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Cadastrar Pedido',
          headerShown: true,
        }}
      />
      <OrderCreateForm />
    </>
  );
}
