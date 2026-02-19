import { Layout } from '@/components/list/Layout'
import { personalWarningsListConfig } from '@/config/list/personal'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function MyWarningsScreen() {
  return <Layout config={personalWarningsListConfig} />
}
