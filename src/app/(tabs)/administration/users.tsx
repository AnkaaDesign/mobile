import { Redirect } from "expo-router";
import { routeToMobilePath } from "@/lib/route-mapper";
import { routes } from '../../../constants';

// Redirect to users list page
export default function UsersIndexPage() {
  return <Redirect href={routeToMobilePath(routes.administration.users.list) as any} />;
}
