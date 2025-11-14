import { Stack, useLocalSearchParams } from 'expo-router';
import { OrderEditForm } from '@/components/inventory/order/form/order-edit-form';

export default function EstoquePedidosEditarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Editar Pedido',
          headerShown: true,
        }}
      />
      <OrderEditForm orderId={id} />
    </>
  );
}
