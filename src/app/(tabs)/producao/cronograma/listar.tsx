import { TaskScheduleLayout } from '@/components/production/task/schedule'
import { tasksListConfig } from '@/config/list/production/tasks'

export default function TaskScheduleScreen() {
  // Using optimized select patterns for better performance
  return <TaskScheduleLayout config={tasksListConfig} />
}
