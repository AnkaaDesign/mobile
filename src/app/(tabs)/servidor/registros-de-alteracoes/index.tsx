import { Redirect } from "expo-router";
import { routes } from "@/constants";
import { mobileRoute } from '@/constants/routes.types';
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function RegistrosDeAlteracoesIndex() {
  useScreenReady();
  return <Redirect href={mobileRoute(routes.server.changeLogs.list) as any} />;
}
