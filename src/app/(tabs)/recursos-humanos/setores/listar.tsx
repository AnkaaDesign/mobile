import { Redirect } from "expo-router";
import { routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { useScreenReady } from "@/hooks/use-screen-ready";

// Sectors are managed in the Administration section, redirect there
export default function HumanResourcesSectorsListScreen() {
  useScreenReady();
  return <Redirect href={mobileRoute(routes.administration.sectors.root) as any} />;
}
