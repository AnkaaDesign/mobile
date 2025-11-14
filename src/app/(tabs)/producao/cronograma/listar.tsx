import { Layout } from '@/components/list/Layout'
import { tasksListConfig } from '@/config/list/production/tasks'

export default function TaskListScreen() {
  return <Layout config={tasksListConfig} />
}
