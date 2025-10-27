import { Redirect } from 'expo-router';
import { routes } from '../../../../constants';
import { routeToMobilePath } from '@/lib/route-mapper';

export default function ChangeLogsIndex() {
  return <Redirect href={routeToMobilePath(routes.administration.changeLogs.list) as any} />;
}
