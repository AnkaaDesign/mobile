import { Stack } from 'expo-router';
import { OrderCreateForm } from '@/components/inventory/order/form/order-create-form';

export default function EstoquePedidosCadastrarScreen() {
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
