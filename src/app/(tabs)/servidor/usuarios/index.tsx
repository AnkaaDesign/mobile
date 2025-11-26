// This route has been moved to /servidor/system-users.tsx
// Redirect to the correct route
import { Redirect } from "expo-router";

export default function UsuariosScreen() {
  return <Redirect href="/servidor/system-users" />;
}
