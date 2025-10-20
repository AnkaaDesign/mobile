import { useEffect } from "react";
import { router } from "expo-router";

export default function PaintsScreen() {
  useEffect(() => {
    // Redirect to paints list page
    router.replace("/(tabs)/production/paints/list");
  }, []);

  return null;
}
