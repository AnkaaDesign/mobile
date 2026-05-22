import { View } from 'react-native'
import { Layout } from '@/components/list/Layout'
import { personalHolidaysListConfig } from '@/config/list/personal'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function MyHolidaysScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Layout config={personalHolidaysListConfig} />
    </View>
  )
}
