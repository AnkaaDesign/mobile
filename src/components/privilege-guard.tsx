import { ReactNode } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { SECTOR_PRIVILEGES, SECTOR_PRIVILEGES_LABELS } from "@/constants";
import { hasAnyPrivilege, hasPrivilege, hasAllPrivileges } from "@/utils";
import { getSectorPrivilegesLabel } from "@/utils";

import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { IconShield } from "@tabler/icons-react-native";
import type { User } from '@/types/user';

interface PrivilegeGuardProps {
  children: ReactNode;
  requiredPrivilege?: SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[];
  requireAll?: boolean; // If true, user must have ALL privileges (AND logic). If false, user needs ANY (OR logic). Default: false
  fallbackScreen?: string;
  showUnauthorized?: boolean; // If true, shows unauthorized screen. If false, redirects silently. Default: true
}

/**
 * Mobile Privilege Guard Component
 * Protects screens/components based on user privileges
 * Matches backend @Roles decorator behavior with OR logic by default
 */
export function PrivilegeGuard({
  children,
  requiredPrivilege,
  requireAll = false,
  fallbackScreen = '/(autenticacao)/entrar',
  showUnauthorized = true,
}: PrivilegeGuardProps) {
  const { user, isLoading } = useAuth();

  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ThemedText>Carregando...</ThemedText>
      </ThemedView>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    router.replace('/(autenticacao)/entrar' as any);
    return null;
  }

  // If no privilege required, render children
  if (!requiredPrivilege) {
    return <>{children}</>;
  }

  // Check if user has required privilege(s)
  const hasAccess = checkUserPrivileges(user, requiredPrivilege, requireAll);

  if (!hasAccess) {
    if (showUnauthorized) {
      return <UnauthorizedScreen requiredPrivilege={requiredPrivilege} fallbackScreen={fallbackScreen} />;
    } else {
      // Silent redirect
      router.replace(fallbackScreen as any);
      return null;
    }
  }

  // User has required privilege, render children
  return <>{children}</>;
}

/**
 * Check if user has required privilege(s)
 * Supports both single privileges and arrays of privileges
 */
function checkUserPrivileges(user: User | null, requiredPrivilege: SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[], requireAll: boolean = false): boolean {
  if (!user || !requiredPrivilege) return false;

  // Handle array of privileges
  if (Array.isArray(requiredPrivilege)) {
    if (requireAll) {
      // AND logic - user must have ALL privileges
      return hasAllPrivileges(user, requiredPrivilege);
    } else {
      // OR logic - user needs ANY of the privileges (default backend behavior)
      return hasAnyPrivilege(user, requiredPrivilege);
    }
  }

  // Handle single privilege
  return hasPrivilege(user, requiredPrivilege);
}

/**
 * Helper function to get privilege labels for arrays
 * Uses existing getSectorPrivilegesLabel utility for single privileges
 */
function getRequiredPrivilegeLabels(requiredPrivilege: SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[]): string {
  if (Array.isArray(requiredPrivilege)) {
    return requiredPrivilege.map((privilege) => getSectorPrivilegesLabel(privilege)).join(", ");
  }

  return getSectorPrivilegesLabel(requiredPrivilege);
}

/**
 * Helper function to get user privilege labels
 * Handles user's sector privileges properly using existing utilities
 */
function getUserPrivilegeLabels(user: User | null): string {
  if (!user?.sector?.privileges) {
    return "Nenhuma";
  }

  // If privileges is an array
  if (Array.isArray(user.sector.privileges)) {
    return user.sector.privileges.map((privilege: SECTOR_PRIVILEGES) => getSectorPrivilegesLabel(privilege)).join(", ");
  }

  // If privileges is a single value
  if (typeof user.sector.privileges === "string" && SECTOR_PRIVILEGES_LABELS[user.sector.privileges as SECTOR_PRIVILEGES]) {
    return getSectorPrivilegesLabel(user.sector.privileges as SECTOR_PRIVILEGES);
  }

  // Fallback
  return user.sector.privileges.toString();
}

/**
 * Unauthorized Access Screen for Mobile
 */
function UnauthorizedScreen({ requiredPrivilege}: { requiredPrivilege: SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[]; fallbackScreen: string }) {
  const { user, logout } = useAuth();

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/inicio' as any);
    }
  };

  const handleGoHome = () => {
    router.replace('/(tabs)/inicio' as any);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(autenticacao)/entrar' as any);
  };

  return (
    <ThemedView style={{ flex: 1, padding: 20, justifyContent: "center", alignItems: "center" }}>
      <View style={{ alignItems: "center", marginBottom: 30 }}>
        <IconShield size={64} color="#ef4444" style={{ marginBottom: 16 }} />

        <ThemedText
          style={{
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Acesso Negado
        </ThemedText>

        <ThemedText
          style={{
            fontSize: 16,
            textAlign: "center",
            opacity: 0.7,
            marginBottom: 20,
          }}
        >
          Você não tem permissão para acessar esta tela.
        </ThemedText>
      </View>

      <View
        style={{
          backgroundColor: "#fef2f2",
          padding: 16,
          borderRadius: 8,
          marginBottom: 30,
          width: "100%",
        }}
      >
        <ThemedText style={{ fontSize: 14, color: "#991b1b", marginBottom: 4 }}>
          <ThemedText style={{ fontWeight: "bold" }}>Permissão necessária:</ThemedText> {getRequiredPrivilegeLabels(requiredPrivilege)}
        </ThemedText>
        <ThemedText style={{ fontSize: 14, color: "#991b1b" }}>
          <ThemedText style={{ fontWeight: "bold" }}>Sua permissão:</ThemedText> {getUserPrivilegeLabels(user)}
        </ThemedText>
      </View>

      <ThemedText
        style={{
          fontSize: 14,
          textAlign: "center",
          opacity: 0.6,
          marginBottom: 20,
        }}
      >
        Entre em contato com um administrador para solicitar as permissões necessárias.
      </ThemedText>

      <View style={{ width: "100%", gap: 12 }}>
        <Button onPress={handleGoHome} style={{ width: "100%" }}>
          <ThemedText style={{ color: "white" }}>Ir para Dashboard</ThemedText>
        </Button>

        <Button onPress={handleGoBack} variant="outline" style={{ width: "100%" }}>
          <ThemedText>Voltar</ThemedText>
        </Button>

        <Button onPress={handleLogout} variant="default" style={{ width: "100%" }}>
          <ThemedText style={{ opacity: 0.6 }}>Sair da Conta</ThemedText>
        </Button>
      </View>
    </ThemedView>
  );
}

/**
 * Hook for checking privileges in components
 * Returns privilege checking functions for use in components
 */
export function usePrivilegeCheck() {
  const { user } = useAuth();

  const hasPrivilegeAccess = (privilege: SECTOR_PRIVILEGES) => {
    return hasPrivilege(user, privilege);
  };

  const hasAnyPrivilegeAccess = (privileges: SECTOR_PRIVILEGES[]) => {
    return hasAnyPrivilege(user, privileges);
  };

  const hasAllPrivilegeAccess = (privileges: SECTOR_PRIVILEGES[]) => {
    return hasAllPrivileges(user, privileges);
  };

  const canAccess = (privilege: SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[], requireAll: boolean = false) => {
    return checkUserPrivileges(user, privilege, requireAll);
  };

  return {
    user,
    hasPrivilegeAccess,
    hasAnyPrivilegeAccess,
    hasAllPrivilegeAccess,
    canAccess,
    isAdmin: user ? hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN) : false,
    isLeader: user ? hasPrivilege(user, SECTOR_PRIVILEGES.LEADER) : false,
  };
}
