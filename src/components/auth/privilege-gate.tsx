/**
 * <PrivilegeGate> — unified privilege wrapper.
 *
 * Replaces inline `hasPrivilege(user, ...)` + `Alert.alert("Acesso negado")`
 * patterns and the divergent <PrivilegeGuard> / <RoutePrivilegeGuard>
 * components. Backed by `usePrivilegeGate`.
 */
import React, { ReactNode, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";

import { useTheme } from "@/lib/theme";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { IconShield } from "@tabler/icons-react-native";
import { useAuth } from "@/contexts/auth-context";
import { useNav } from "@/contexts/nav";
import { usePrivilegeGate, type PrivilegeReq } from "@/hooks/use-privilege-gate";
import { mobileRoute, type AppRoute } from "@/constants/routes.types";
import { routes } from "@/constants/routes";

export type PrivilegeGateFallback = "unauthorized" | "redirect" | ReactNode;

export interface PrivilegeGateProps {
  required: PrivilegeReq;
  /** For `self` requirements — supply the resource's owner id. */
  resource?: { ownerId?: string | null };
  /** `pre` (default) renders immediately. `post` waits for resource. */
  when?: "pre" | "post";
  /**
   * What to render when access is denied:
   * - 'unauthorized' (default): inline access-denied screen
   * - 'redirect': navigate to `redirectTo` (default: home)
   * - ReactNode: any custom fallback
   */
  fallback?: PrivilegeGateFallback;
  /** Target for `fallback: 'redirect'`. Defaults to home tab. */
  redirectTo?: AppRoute;
  children: ReactNode;
}

export function PrivilegeGate({
  required,
  resource,
  when,
  fallback = "unauthorized",
  redirectTo,
  children,
}: PrivilegeGateProps) {
  const { allowed, pending, reason } = usePrivilegeGate(required, { resource, when });

  if (pending) {
    return <CenteredSpinner />;
  }

  if (allowed) {
    return <>{children}</>;
  }

  if (fallback === "redirect") {
    return <RedirectFallback to={redirectTo} />;
  }

  if (fallback === "unauthorized" || fallback === undefined) {
    return <UnauthorizedScreen reason={reason} />;
  }

  return <>{fallback}</>;
}

function CenteredSpinner() {
  const { colors } = useTheme();
  return (
    <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </ThemedView>
  );
}

// NOTE: `to` defaults to home inside the effect (with separate statements)
// instead of `to ?? mobileRoute(routes.home)` at the call site — unioning two
// `AppRoute` values makes TS normalize the huge generated `Href` union twice
// and fail with TS2590 ("union type too complex to represent").
function RedirectFallback({ to }: { to?: AppRoute }) {
  const nav = useNav();
  useEffect(() => {
    if (to) {
      nav.replace(to);
    } else {
      nav.replace(mobileRoute(routes.home));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);
  return <CenteredSpinner />;
}

function UnauthorizedScreen({ reason }: { reason?: string }) {
  const { logout } = useAuth();
  const nav = useNav();

  const message =
    reason === "unauthenticated"
      ? "Você precisa estar autenticado para acessar esta tela."
      : reason === "wrong-owner"
        ? "Este recurso pertence a outro usuário."
        : "Você não tem permissão para acessar esta tela.";

  return (
    <ThemedView style={{ flex: 1, padding: 20, justifyContent: "center", alignItems: "center" }}>
      <View style={{ alignItems: "center", marginBottom: 30 }}>
        <IconShield size={64} color="#ef4444" style={{ marginBottom: 16 }} />
        <ThemedText style={{ fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 8 }}>
          Acesso Negado
        </ThemedText>
        <ThemedText style={{ fontSize: 16, textAlign: "center", opacity: 0.7, marginBottom: 20 }}>
          {message}
        </ThemedText>
      </View>
      <View style={{ width: "100%", gap: 12 }}>
        <Button onPress={() => nav.replace(mobileRoute(routes.home))} style={{ width: "100%" }}>
          <ThemedText style={{ color: "white" }}>Ir para Início</ThemedText>
        </Button>
        <Button onPress={() => nav.goBack()} variant="outline" style={{ width: "100%" }}>
          <ThemedText>Voltar</ThemedText>
        </Button>
        <Button onPress={() => logout()} variant="default" style={{ width: "100%" }}>
          <ThemedText style={{ opacity: 0.6 }}>Sair da Conta</ThemedText>
        </Button>
      </View>
    </ThemedView>
  );
}
