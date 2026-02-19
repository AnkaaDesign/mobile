import { Redirect } from 'expo-router';
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function RepresentativesIndex() {
  useScreenReady();
  return <Redirect href={routeToMobilePath(routes.administration.representatives.list) as any} />;
}
