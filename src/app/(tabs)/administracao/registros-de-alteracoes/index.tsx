import { Redirect } from "expo-router";
import { routes } from "@/constants";
import { mobileRoute } from '@/constants/routes.types';
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function AdministrationChangeLogsIndex() {
  useScreenReady();
  return <Redirect href={mobileRoute(routes.administration.changeLogs.list)} />;
}
