import { View } from 'react-native'
import { Layout } from '@/components/list/Layout'
import { personalHolidaysListConfig } from '@/config/list/personal'
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useTutorialTarget, TUTORIAL_TARGETS } from "@/components/tutorial";

export default function MyHolidaysScreen() {
  const feriadosTarget = useTutorialTarget(TUTORIAL_TARGETS.pessoalFeriados);
  return (
    <View ref={feriadosTarget.ref} onLayout={feriadosTarget.onLayout} collapsable={false} style={{ flex: 1 }}>
      <Layout config={personalHolidaysListConfig} />
    </View>
  )
}
