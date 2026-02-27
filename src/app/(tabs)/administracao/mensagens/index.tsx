import { Redirect } from 'expo-router';
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function MessagesIndex() {
  useScreenReady();
  return <Redirect href={routeToMobilePath(routes.administration.messages.list) as any} />;
}
