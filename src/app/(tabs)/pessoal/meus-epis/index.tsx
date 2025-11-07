import { useEffect } from "react";
import { useRouter } from "expo-router";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function MyPPEIndexScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to request page since that's what exists
    router.replace("/pessoal/meus-epis/request" as any);
  }, [router]);

  return <LoadingScreen />;
}
