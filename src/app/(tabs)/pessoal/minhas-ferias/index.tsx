import { View } from 'react-native'
import { Layout } from '@/components/list/Layout'
import { personalVacationsListConfig } from '@/config/list/personal'
import { useScreenReady } from '@/hooks/use-screen-ready'

export default function MyVacationsScreen() {
  useScreenReady()
  return (
    <View style={{ flex: 1 }}>
      <Layout config={personalVacationsListConfig} />
    </View>
  )
}
