import { TaskScheduleLayout } from '@/components/production/task/schedule'
import { tasksListOptimizedConfig } from '@/config/list/production/tasks-optimized'

export default function TaskScheduleScreen() {
  // Using OPTIMIZED config to reduce API payload from 1.72MB to ~200KB
  return <TaskScheduleLayout config={tasksListOptimizedConfig} />
}
