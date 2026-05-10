import { Stack } from "expo-router";
import { MessageForm } from "@/components/administration/message/form/message-form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { SECTOR_PRIVILEGES } from "@/constants";

export default function CreateMessageScreen() {
  useScreenReady();
  return (
    <PrivilegeGate required={SECTOR_PRIVILEGES.ADMIN}>
      <Stack.Screen
        options={{
          title: "Criar Mensagem",
          headerBackTitle: "Voltar",
        }}
      />
      <MessageForm mode="create" />
    </PrivilegeGate>
  );
}
