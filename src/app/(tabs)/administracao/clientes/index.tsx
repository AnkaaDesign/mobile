import { Redirect } from 'expo-router';
import { routes } from '../../../../constants';
import { routeToMobilePath } from '@/lib/route-mapper';

export default function CustomersIndex() {
  return <Redirect href={routeToMobilePath(routes.administration.customers.list) as any} />;
}
