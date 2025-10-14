import { Redirect } from "expo-router";
import { routes } from "@/constants";
import { routeToMobilePath } from "@/lib/route-mapper";

// Redirect to sectors list page
export default function HumanResourcesSectorsScreen() {
  return <Redirect href={routeToMobilePath(routes.humanResources.sectors.list) as any} />;
}
