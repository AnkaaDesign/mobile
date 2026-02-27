import { Stack } from "expo-router";
import { MessageForm } from "@/components/administration/message/form/message-form";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function CreateMessageScreen() {
  useScreenReady();
  return (
    <>
      <Stack.Screen
        options={{
          title: "Criar Mensagem",
          headerBackTitle: "Voltar",
        }}
      />
      <MessageForm mode="create" />
    </>
  );
}
