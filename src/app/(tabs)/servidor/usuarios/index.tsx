// This route has been moved to /servidor/system-users.tsx
// Redirect to the correct route
import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function UsuariosScreen() {
  useScreenReady();
  return <Redirect href="/servidor/system-users" />;
}
