import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { checkUserHasPrivilege } from '@/lib/privileges';
import { SECTOR_PRIVILEGES } from '@/constants/enums';

/**
 * Route to privilege mapping
 * Maps route patterns to required privileges
 */
const ROUTE_PRIVILEGES: Record<string, string[]> = {
  // Administration routes
  'administracao': [SECTOR_PRIVILEGES.ADMIN],

  // HR routes
  'recursos-humanos': [SECTOR_PRIVILEGES.HUMAN_RESOURCES],

  // Production routes
  'producao': [SECTOR_PRIVILEGES.PRODUCTION],

  // Inventory routes
  'estoque': [SECTOR_PRIVILEGES.WAREHOUSE],

  // Painting routes
  'pintura': [SECTOR_PRIVILEGES.PLOTTING],

  // Financial routes
  'financeiro': [SECTOR_PRIVILEGES.FINANCIAL],

  // Server/Admin routes
  'servidor': [SECTOR_PRIVILEGES.ADMIN],
};

/**
 * Hook that checks if user has access to current route
 * Redirects to home if they don't have privilege
 */
export function usePrivilegeGuard() {
  const { user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!user) return;

    // Get the first segment (main section)
    const mainSection = segments[1]; // segments[0] is usually "(tabs)"

    if (!mainSection) return;

    // Check if this route requires privileges
    const requiredPrivileges = ROUTE_PRIVILEGES[mainSection];

    if (!requiredPrivileges) return; // Public route

    // Check if user has any of the required privileges
    const hasAccess = requiredPrivileges.some(privilege =>
      checkUserHasPrivilege(user, privilege as any)
    );

    if (!hasAccess) {
      // User doesn't have access, redirect to home
      console.warn(`Access denied to /${mainSection} - redirecting to home`);
      router.replace('/(tabs)/inicio');
    }
  }, [segments, user, router]);
}

/**
 * Wrapper component that adds privilege guard to any screen
 */
export function withPrivilegeGuard<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function PrivilegeGuardedComponent(props: P) {
    usePrivilegeGuard();
    return <Component {...props} />;
  };
}
