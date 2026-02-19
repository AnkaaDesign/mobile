import { useMemo } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { Layout } from '@/components/list/Layout'
import { orderItemsListConfig } from '@/config/list/inventory/order-items'
import { useScreenReady } from '@/hooks/use-screen-ready';

/**
 * Order Items List Screen (Nested Route)
 *
 * This screen displays items for a specific order.
 * It extracts the orderId from route params and passes it to the config.
 */
export default function OrderItemsListScreen() {
  useScreenReady();
  const { orderId } = useLocalSearchParams<{ orderId: string }>()

  // Merge the base config with the dynamic orderId filter
  const config = useMemo(
    () => ({
      ...orderItemsListConfig,
      query: {
        ...orderItemsListConfig.query,
        where: {
          ...orderItemsListConfig.query.where,
          orderIds: orderId ? [orderId] : undefined,
        },
      },
      actions: {
        ...orderItemsListConfig.actions,
        create: orderItemsListConfig.actions?.create
          ? {
              ...orderItemsListConfig.actions.create,
              route: `/estoque/pedidos/${orderId}/items/adicionar`,
            }
          : undefined,
      },
    }),
    [orderId]
  )

  return <Layout config={config} />
}
