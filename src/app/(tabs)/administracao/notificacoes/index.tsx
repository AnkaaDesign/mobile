import { Redirect } from 'expo-router';
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';

export default function NotificationsIndex() {
  return <Redirect href={routeToMobilePath(routes.administration.notifications.list) as any} />;
}
