import { Redirect } from "expo-router";
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { useScreenReady } from '@/hooks/use-screen-ready';

// Customers are managed in the Administration section, redirect there
export default function FinancialCustomerListScreen() {
  useScreenReady();
  return <Redirect href={routeToMobilePath(routes.administration.customers.root) as any} />;
}
