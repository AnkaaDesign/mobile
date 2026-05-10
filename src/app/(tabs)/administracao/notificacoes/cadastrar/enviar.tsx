import { Stack } from "expo-router";
import { NotificationForm } from "@/components/administration/notification/form/notification-form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { SECTOR_PRIVILEGES } from "@/constants";

export default function SendNotificationScreen() {
  useScreenReady();
  return (
    <PrivilegeGate required={SECTOR_PRIVILEGES.ADMIN}>
      <Stack.Screen
        options={{
          title: "Enviar Notificação",
          headerBackTitle: "Voltar",
        }}
      />
      <NotificationForm mode="create" />
    </PrivilegeGate>
  );
}
