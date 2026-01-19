import { Stack } from "expo-router";
import { NotificationForm } from "@/components/administration/notification/form/notification-form";

export default function SendNotificationScreen() {
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
