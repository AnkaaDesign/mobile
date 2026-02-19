import { TaskScheduleLayout } from '@/components/production/task/schedule'
import { tasksListConfig } from '@/config/list/production/tasks'

export default function TaskScheduleScreen() {
  // useScreenReady is called inside TaskScheduleLayout with data loading state
  return <TaskScheduleLayout config={tasksListConfig} />
}
