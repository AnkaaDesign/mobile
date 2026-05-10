import { Redirect } from "expo-router";
import { routes } from "@/constants";
import { mobileRoute } from '@/constants/routes.types';
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function BackupsIndex() {
  useScreenReady();
  return <Redirect href={mobileRoute(routes.server.backups.list)} />;
}
