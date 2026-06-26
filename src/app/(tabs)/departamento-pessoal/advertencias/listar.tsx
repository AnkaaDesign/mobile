import { Layout } from '@/components/list/Layout'
import { warningsListConfig } from '@/config/list/personnel-department/warnings'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function WarningListScreen() {
  return <Layout config={warningsListConfig} />
}
