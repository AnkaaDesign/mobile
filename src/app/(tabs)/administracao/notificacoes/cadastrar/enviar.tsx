import { Stack } from "expo-router";
import { NotificationForm } from "@/components/administration/notification/form/notification-form";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function SendNotificationScreen() {
  useScreenReady();
  return (
    <>
      <Stack.Screen
        options={{
          title: "Enviar Notificação",
          headerBackTitle: "Voltar",
        }}
      />
      <NotificationForm mode="create" />
    </>
  );
}
