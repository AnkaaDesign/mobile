import { useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";

// Redirect to the consolidated paint catalog details
export default function PaintDetailsScreen() {
  const { id } = useLocalSearchParams();

  useEffect(() => {
    router.replace(`/(tabs)/painting/catalog/details/${id}`);
  }, [id]);

  return null;
}