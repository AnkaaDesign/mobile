import { View } from 'react-native'
import { Layout } from '@/components/list/Layout'
import { personalPpeDeliveriesListConfig } from '@/config/list/personal'
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useTutorialTarget, TUTORIAL_TARGETS } from "@/components/tutorial";

export default function MyPPEIndexScreen() {
  const episTarget = useTutorialTarget(TUTORIAL_TARGETS.pessoalEpis);
  return (
    <View ref={episTarget.ref} onLayout={episTarget.onLayout} style={{ flex: 1 }}>
      <Layout config={personalPpeDeliveriesListConfig} />
    </View>
  )
}
