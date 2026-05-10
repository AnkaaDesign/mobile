import { Redirect } from "expo-router";
import { routes } from "@/constants";
import { mobileRoute } from '@/constants/routes.types';
import { useScreenReady } from '@/hooks/use-screen-ready';

/**
 * Collaborators index page
 * Redirects to the list view as the default page for this section
 */
export default function CollaboratorsIndex() {
  useScreenReady();
  return <Redirect href={mobileRoute(routes.administration.collaborators.list)} />;
}
