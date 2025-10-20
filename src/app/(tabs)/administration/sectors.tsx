import { Redirect } from "expo-router";
import { routeToMobilePath } from "@/lib/route-mapper";
import { routes } from '../../../constants';

// Redirect to sectors list page
export default function SectorsIndexPage() {
  return <Redirect href={routeToMobilePath(routes.administration.sectors.list) as any} />;
}
