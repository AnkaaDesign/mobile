import { Layout } from '@/components/list/Layout'
import { personalEmployeesListConfig } from '@/config/list/personal/employees'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function PersonalEmployeesListScreen() {
  return <Layout config={personalEmployeesListConfig} />
}
