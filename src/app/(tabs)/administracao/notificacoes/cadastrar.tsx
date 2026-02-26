import { NotificationForm } from "@/components/administration/notification/form/notification-form";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";

export default function CreateNotificationScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return <NotificationForm key={formKey} mode="create" />;
}
