import { Layout } from '@/components/list/Layout'
import { bonusesListConfig } from '@/config/list/personnel-department/bonuses'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function BonusListScreen() {
  return <Layout config={bonusesListConfig} />
}
