import { Redirect } from "expo-router";

/**
 * Redirects to the new catalogo route structure
 * Leaders should use /catalogo instead of /pintura/catalogo-basico
 */
export default function CatalogoBasicoIndex() {
  return <Redirect href="/catalogo" />;
}
