import { Layout } from '@/components/list/Layout'
import { workAccidentsListConfig } from '@/config/list/personnel-department/work-accidents'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function WorkAccidentListScreen() {
  useScreenReady();
  return <Layout config={workAccidentsListConfig} />
}
