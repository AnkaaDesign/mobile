import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

/**
 * Redirects to the new catalogo route structure
 * Leaders should use /catalogo instead of /pintura/catalogo-basico
 */
export default function CatalogoBasicoIndex() {
  useScreenReady();
  return <Redirect href="/catalogo" />;
}
