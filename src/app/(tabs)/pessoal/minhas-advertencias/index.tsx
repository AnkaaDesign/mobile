import { View } from 'react-native'
import { Layout } from '@/components/list/Layout'
import { personalWarningsListConfig } from '@/config/list/personal'
import { useScreenReady } from '@/hooks/use-screen-ready'

export default function MyWarningsScreen() {
  void useScreenReady
  return (
    <View style={{ flex: 1 }}>
      <Layout config={personalWarningsListConfig} />
    </View>
  )
}
