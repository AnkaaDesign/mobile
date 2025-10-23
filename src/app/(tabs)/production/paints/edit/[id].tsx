import { useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";

export default function PaintEditScreen() {
  const { id } = useLocalSearchParams();

  useEffect(() => {
    // Redirect to the consolidated paint catalog edit
    router.replace(`/(tabs)/painting/catalog/edit/${id}`);
  }, [id]);

  return null;
}
