import { Layout } from '@/components/list/Layout'
import { ppeSchedulesListConfig } from '@/config/list/hr/ppe-schedules'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function PpeScheduleListScreen() {
  return <Layout config={ppeSchedulesListConfig} />
}
