import { Redirect, useLocalSearchParams } from "expo-router";

import { mobileRoute } from "@/constants/routes.types";
import { routes } from "@/constants";
import { useScreenReady } from "@/hooks/use-screen-ready";

/**
 * Mobile does not yet support editing single movements (batch-only).
 * Redirect to the details page so users land somewhere sensible.
 */
export default function EditMovementPage() {
  useScreenReady();
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) return null;

  return <Redirect href={mobileRoute(routes.inventory.activities.details(id))} />;
}
