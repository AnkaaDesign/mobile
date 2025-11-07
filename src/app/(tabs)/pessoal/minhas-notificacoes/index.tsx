import { useEffect } from "react";
import { useRouter } from "expo-router";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function MyNotificationsIndexScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to configurations page since that's what exists
    router.replace("/pessoal/minhas-notificacoes/configuracoes" as any);
  }, [router]);

  return <LoadingScreen />;
}
