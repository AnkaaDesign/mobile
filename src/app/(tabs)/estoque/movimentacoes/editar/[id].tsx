import { useEffect } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes } from "@/constants";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function EditMovementPage() {
  useScreenReady();
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    // Redirect to details page as mobile doesn't have batch edit yet
    if (id) {
      router.replace(routeToMobilePath(routes.inventory.activities.details(id)) as any);
    }
  }, [id]);

  return null;
}
