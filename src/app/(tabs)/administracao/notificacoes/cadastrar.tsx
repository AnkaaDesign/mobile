import { NotificationForm } from "@/components/administration/notification/form/notification-form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function CreateNotificationScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return (
    <PrivilegeGate required={SECTOR_PRIVILEGES.ADMIN}>
      <NotificationForm key={formKey} mode="create" />
    </PrivilegeGate>
  );
}
