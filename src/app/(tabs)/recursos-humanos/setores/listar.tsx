import { Redirect } from "expo-router";
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { useScreenReady } from '@/hooks/use-screen-ready';

// Sectors are managed in the Administration section, redirect there
export default function HumanResourcesSectorsListScreen() {
  useScreenReady();
  return <Redirect href={routeToMobilePath(routes.administration.sectors.root) as any} />;
}
