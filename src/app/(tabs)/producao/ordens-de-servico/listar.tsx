import { View } from 'react-native'
import { Layout } from '@/components/list/Layout'
import { serviceOrdersListConfig } from '@/config/list/production/service-orders'
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useTutorialTarget, TUTORIAL_TARGETS } from '@/components/tutorial'

export default function ServiceOrderListScreen() {
  const listTarget = useTutorialTarget(TUTORIAL_TARGETS.ordensList)

  return (
    <View ref={listTarget.ref} onLayout={listTarget.onLayout} collapsable={false} style={{ flex: 1 }}>
      <Layout config={serviceOrdersListConfig} />
    </View>
  )
}
