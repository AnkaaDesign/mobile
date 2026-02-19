import { NotificationForm } from "@/components/administration/notification/form/notification-form";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function CreateNotificationScreen() {
  useScreenReady();
  return <NotificationForm mode="create" />;
}
