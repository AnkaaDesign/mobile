import { Redirect } from 'expo-router';
import { routes } from '../../../../constants';
import { routeToMobilePath } from '@/lib/route-mapper';

export default function FilesIndex() {
  return <Redirect href={routeToMobilePath(routes.administration.files.list) as any} />;
}
