import { Redirect } from "expo-router";
import { routes } from "@/constants";
import { mobileRoute } from '@/constants/routes.types';

/**
 * Redirect from singular /servidor/backup to the correct route
 * The actual backup list page is at /servidor/backups/listar
 */
export default function BackupRedirect() {
  return <Redirect href={mobileRoute(routes.server.backups.list)} />;
}
