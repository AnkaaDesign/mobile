import type { SECTOR_PRIVILEGES } from '../../constants';

// Privilege Guard Props
export interface PrivilegeGuardProps {
  children: React.ReactNode;
  minimumPrivilege: SECTOR_PRIVILEGES;
  fallback?: React.ReactNode;
}

// Route Privilege Guard Props
export interface RoutePrivilegeGuardProps {
  children: React.ReactNode;
  requiredPrivilege: SECTOR_PRIVILEGES;
}
