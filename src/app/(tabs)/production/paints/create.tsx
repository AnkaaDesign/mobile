import { useEffect } from "react";
import { router } from "expo-router";

export default function PaintsCreateScreen() {
  useEffect(() => {
    // Redirect to the consolidated paint catalog create
    router.replace("/(tabs)/painting/catalog/create");
  }, []);

  return null;
}
