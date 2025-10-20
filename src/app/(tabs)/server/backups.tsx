import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function BackupsScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the backup list
    router.replace("/administration/backups/list");
  }, [router]);

  return null;
}