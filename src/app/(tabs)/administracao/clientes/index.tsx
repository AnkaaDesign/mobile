import { Redirect } from 'expo-router';
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';

export default function CustomersIndex() {
  return <Redirect href={routeToMobilePath(routes.administration.customers.list) as any} />;
}
