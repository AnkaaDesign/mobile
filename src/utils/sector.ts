// packages/utils/src/sector.ts

import type { Sector } from '../types';
import { SECTOR_PRIVILEGES, TEAM_LEADER, SECTOR_PRIVILEGES_LABELS } from '../constants';
import { getSectorPrivilegeSortOrder, canAccessSector, canAccessAnyPrivilege, canAccessAllPrivileges } from "./privilege";

// =====================
// Display Formatters
// =====================

export const formatSectorName = (name: string): string => {
  return name.replace(/\b\w/g, (l) => l.toUpperCase());
};

export const getSectorDisplayName = (sector: Sector): string => {
  return sector.name;
};

export const getSectorFullDisplay = (sector: Sector): string => {
  const parts = [sector.name];
  if (sector.users && sector.users.length > 0) {
    parts.push(`(${sector.users.length} usuários)`);
  }
  return parts.join(" ");
};

// =====================
// Privilege Management (imported from privilege.ts)
// =====================
// Functions getSectorPrivilegeSortOrder, canAccessSector, canAccessAnyPrivilege, canAccessAllPrivileges
// are imported from ./privilege.ts

export const getSectorPrivilegeDescription = (privilege: SECTOR_PRIVILEGES | typeof TEAM_LEADER): string => {
  const descriptions: Record<SECTOR_PRIVILEGES | typeof TEAM_LEADER, string> = {
    [SECTOR_PRIVILEGES.BASIC]: "Acesso básico ao sistema",
    [SECTOR_PRIVILEGES.MAINTENANCE]: "Acesso a funcionalidades de limpeza e manutenção",
    [SECTOR_PRIVILEGES.WAREHOUSE]: "Acesso completo ao almoxarifado",
    [SECTOR_PRIVILEGES.DESIGNER]: "Acesso a design e recorte",
    [SECTOR_PRIVILEGES.LOGISTIC]: "Acesso a logística e garagens",
    [SECTOR_PRIVILEGES.PRODUCTION]: "Acesso a funcionalidades de produção",
    [TEAM_LEADER]: "Acesso de líder de equipe",
    [SECTOR_PRIVILEGES.HUMAN_RESOURCES]: "Acesso a recursos humanos",
    [SECTOR_PRIVILEGES.FINANCIAL]: "Acesso financeiro",
    [SECTOR_PRIVILEGES.COMMERCIAL]: "Acesso comercial",
    [SECTOR_PRIVILEGES.PLOTTING]: "Acesso a plotagem e recorte",
    [SECTOR_PRIVILEGES.ADMIN]: "Acesso administrativo completo",
    [SECTOR_PRIVILEGES.EXTERNAL]: "Acesso externo limitado",
  };
  return descriptions[privilege] ?? "Privilégio não definido";
};

export const getSectorPrivilegeColor = (privilege: SECTOR_PRIVILEGES | typeof TEAM_LEADER): string => {
  const colors: Record<SECTOR_PRIVILEGES | typeof TEAM_LEADER, string> = {
    [SECTOR_PRIVILEGES.BASIC]: "gray",
    [SECTOR_PRIVILEGES.MAINTENANCE]: "blue",
    [SECTOR_PRIVILEGES.WAREHOUSE]: "purple",
    [SECTOR_PRIVILEGES.DESIGNER]: "indigo",
    [SECTOR_PRIVILEGES.LOGISTIC]: "cyan",
    [SECTOR_PRIVILEGES.PRODUCTION]: "green",
    [TEAM_LEADER]: "green",
    [SECTOR_PRIVILEGES.HUMAN_RESOURCES]: "pink",
    [SECTOR_PRIVILEGES.FINANCIAL]: "orange",
    [SECTOR_PRIVILEGES.COMMERCIAL]: "orange",
    [SECTOR_PRIVILEGES.PLOTTING]: "teal",
    [SECTOR_PRIVILEGES.ADMIN]: "red",
    [SECTOR_PRIVILEGES.EXTERNAL]: "gray",
  };
  return colors[privilege] ?? "gray";
};

export const getSectorPrivilegeBadgeVariant = (privilege: SECTOR_PRIVILEGES | typeof TEAM_LEADER): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<SECTOR_PRIVILEGES | typeof TEAM_LEADER, "default" | "secondary" | "destructive" | "outline"> = {
    [SECTOR_PRIVILEGES.BASIC]: "outline",
    [SECTOR_PRIVILEGES.MAINTENANCE]: "secondary",
    [SECTOR_PRIVILEGES.WAREHOUSE]: "secondary",
    [SECTOR_PRIVILEGES.DESIGNER]: "default",
    [SECTOR_PRIVILEGES.LOGISTIC]: "default",
    [SECTOR_PRIVILEGES.PRODUCTION]: "default",
    [TEAM_LEADER]: "default",
    [SECTOR_PRIVILEGES.HUMAN_RESOURCES]: "secondary",
    [SECTOR_PRIVILEGES.FINANCIAL]: "secondary",
    [SECTOR_PRIVILEGES.COMMERCIAL]: "secondary",
    [SECTOR_PRIVILEGES.PLOTTING]: "default",
    [SECTOR_PRIVILEGES.ADMIN]: "destructive",
    [SECTOR_PRIVILEGES.EXTERNAL]: "outline",
  };
  return variants[privilege] ?? "outline";
};

/**
 * Get the display label for sector privileges
 * @param privileges - The sector privileges enum value
 * @returns The localized label for the privileges
 */
export function getSectorPrivilegesLabel(privileges: SECTOR_PRIVILEGES | string): string {
  return SECTOR_PRIVILEGES_LABELS[privileges as SECTOR_PRIVILEGES] || privileges;
}

// =====================
// Export all utilities
// =====================

export const sectorUtils = {
  // Display
  formatSectorName,
  getSectorDisplayName,
  getSectorFullDisplay,

  // Privileges
  getSectorPrivilegeSortOrder,
  canAccessSector,
  canAccessAnyPrivilege,
  canAccessAllPrivileges,
  getSectorPrivilegeDescription,
  getSectorPrivilegeColor,
  getSectorPrivilegeBadgeVariant,
  getSectorPrivilegesLabel,
};
