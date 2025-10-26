import { Redirect } from 'expo-router';
import { routes } from '../../../../constants';
import { routeToMobilePath } from '@/lib/route-mapper';

export default function SectorsIndex() {
  return <Redirect href={routeToMobilePath(routes.administration.sectors.list) as any} />;
}
