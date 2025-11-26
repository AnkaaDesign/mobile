import { Redirect } from "expo-router";

/**
 * Redirect from singular /servidor/backup to the correct route
 * The actual backup list page is at /servidor/backups/listar
 */
export default function BackupRedirect() {
  return <Redirect href="/servidor/backups/listar" />;
}
