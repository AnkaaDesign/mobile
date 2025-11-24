import { TaskScheduleLayout } from '@/components/production/task/schedule'
import { tasksListConfig } from '@/config/list/production/tasks'

export default function TaskScheduleScreen() {
  return <TaskScheduleLayout config={tasksListConfig} />
}
