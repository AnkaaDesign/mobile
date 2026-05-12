import { View } from 'react-native'
import { Layout } from '@/components/list/Layout'
import { personalWarningsListConfig } from '@/config/list/personal'
import { useScreenReady } from '@/hooks/use-screen-ready'
import { useTutorialTarget, TUTORIAL_TARGETS } from '@/components/tutorial'

export default function MyWarningsScreen() {
  void useScreenReady
  const advertenciasTarget = useTutorialTarget(TUTORIAL_TARGETS.pessoalAdvertencias)
  return (
    <View
      ref={advertenciasTarget.ref}
      onLayout={advertenciasTarget.onLayout}
      collapsable={false}
      style={{ flex: 1 }}
    >
      <Layout config={personalWarningsListConfig} />
    </View>
  )
}
