import { Layout } from '@/components/list/Layout'
import { personalVacationsListConfig } from '@/config/list/personal'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function MyVacationsScreen() {
  return <Layout config={personalVacationsListConfig} />
}
