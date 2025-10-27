import { Redirect } from "expo-router";
import { routes } from "@/constants";
import { routeToMobilePath } from "@/lib/route-mapper";

// Sectors are managed in the Administration section, redirect there
export default function HumanResourcesSectorsListScreen() {
  return <Redirect href={routeToMobilePath(routes.administration.sectors.root) as any} />;
}
