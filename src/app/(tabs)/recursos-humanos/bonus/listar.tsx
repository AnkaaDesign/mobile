import { Layout } from '@/components/list/Layout'
import { bonusesListConfig } from '@/config/list/hr/bonuses'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function BonusListScreen() {
  return <Layout config={bonusesListConfig} />
}
