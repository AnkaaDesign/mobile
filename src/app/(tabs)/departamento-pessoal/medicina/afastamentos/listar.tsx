import { Layout } from '@/components/list/Layout'
import { leavesListConfig } from '@/config/list/personnel-department/leaves'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function LeaveListScreen() {
  useScreenReady();
  return <Layout config={leavesListConfig} />
}
