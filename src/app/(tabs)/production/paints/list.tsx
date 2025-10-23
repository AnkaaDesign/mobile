import { useEffect } from "react";
import { router } from "expo-router";

// Redirect to the consolidated paint catalog list
export default function PaintsListScreen() {
  useEffect(() => {
    router.replace("/(tabs)/painting/catalog/list");
  }, []);

  return null;
}