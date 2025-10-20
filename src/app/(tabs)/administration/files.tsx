import { useEffect } from "react";
import { router } from "expo-router";

export default function ListFilesScreen() {
  useEffect(() => {
    // Redirect to files list page
    router.replace("/(tabs)/administration/files/list");
  }, []);

  return null;
}
